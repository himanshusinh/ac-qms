// ═══════════════════════════════════════════════════════════════
// AC-QMS Zustand Store — State Management + Workflow Engine
// localStorage persistence, workflow transitions, COA auto-gen
// ═══════════════════════════════════════════════════════════════

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  User, Batch, BatchDocument, AwsTestSection, AuditLog,
  DocStatus, DocType, ActionType, DocumentType, Role,
  CoaResult, WorkflowEntry, CoaSignature,
} from '@/types';
import {
  SEED_USERS, SEED_PRODUCTS, SEED_SPEC_TEMPLATES, SEED_MOA_TEMPLATES,
  SEED_INSTRUMENTS, SEED_REAGENTS, SEED_AUDIT_LOGS,
  SEED_BATCHES, SEED_BATCH_DOCUMENTS, SEED_AWS_SECTIONS,
} from './mockData';
import { generateId, now, generateDocNo } from './utils';

// ─── Store Shape ──────────────────────────────────────────────

export interface AppState {
  // Auth
  currentUser: User | null;

  // Entities
  users: User[];
  batches: Batch[];
  batchDocuments: BatchDocument[];
  awsTestSections: AwsTestSection[];
  auditLogs: AuditLog[];

  // Auth actions
  login: (username: string, password: string) => User | null;
  logout: () => void;

  // User management
  addUser: (user: User) => void;
  updateUser: (user: User) => void;

  // Batch actions
  createBatch: (data: {
    productId: string;
    batchNo: string;
    mfgDate: string;
    expDate: string;
    arNo: string;
    qtySampled: string;
    qtySampledUom: string;
  }) => Batch | null;

  // Document actions
  fetchSpecTemplate: (batchId: string, optionalTestIds: string[]) => BatchDocument | null;
  fetchMoaTemplate: (batchId: string) => BatchDocument | null;
  startAws: (batchId: string) => BatchDocument | null;

  // Workflow engine
  dispatchTransition: (
    documentId: string,
    toStatus: DocStatus,
    comment?: string
  ) => boolean;

  // AWS section actions
  updateAwsSection: (section: AwsTestSection) => void;
  getAwsSections: (batchDocId: string) => AwsTestSection[];

  // COA auto-generation (triggered by workflow)
  autoGenerateCoa: (batchId: string) => BatchDocument | null;

  // Audit
  addAudit: (
    action: ActionType,
    docType: DocumentType,
    docId: string,
    docRef?: string,
    field?: string,
    prev?: string,
    next?: string,
    comment?: string
  ) => void;

  // Helpers
  getBatchDocuments: (batchId: string) => BatchDocument[];
  getBatchDocument: (batchId: string, docType: DocType) => BatchDocument | undefined;
  getProduct: (productId: string) => typeof SEED_PRODUCTS[0] | undefined;
  getSpecTemplate: (productId: string) => typeof SEED_SPEC_TEMPLATES[0] | undefined;
  getMoaTemplate: (productId: string) => typeof SEED_MOA_TEMPLATES[0] | undefined;

  // Reset
  resetDemoData: () => void;
}

// ─── Store Implementation ─────────────────────────────────────

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // ── Initial state ──────────────────────────────────────
      currentUser: null,
      users: SEED_USERS,
      batches: SEED_BATCHES,
      batchDocuments: SEED_BATCH_DOCUMENTS,
      awsTestSections: SEED_AWS_SECTIONS,
      auditLogs: SEED_AUDIT_LOGS,

      // ── Auth ───────────────────────────────────────────────
      login: (username, password) => {
        const user = get().users.find(
          (u) => u.username === username && u.password === password && u.status === 'Active'
        );
        if (!user) return null;
        const updated = { ...user, lastLogin: now() };
        set((s) => ({
          currentUser: updated,
          users: s.users.map((u) => (u.id === user.id ? updated : u)),
        }));
        get().addAudit('LOGIN', 'USER', user.id, user.username);
        return updated;
      },

      logout: () => {
        const user = get().currentUser;
        if (user) {
          get().addAudit('LOGOUT', 'USER', user.id, user.username);
        }
        set({ currentUser: null });
      },

      // ── User Management ────────────────────────────────────
      addUser: (user) => {
        set((s) => ({ users: [...s.users, user] }));
        get().addAudit('CREATE', 'USER', user.id, user.username);
      },

      updateUser: (user) => {
        set((s) => ({
          users: s.users.map((u) => (u.id === user.id ? user : u)),
        }));
      },

      // ── Batch Creation ─────────────────────────────────────
      createBatch: (data) => {
        const user = get().currentUser;
        if (!user || user.role !== 'QC_EXEC') return null;

        const product = SEED_PRODUCTS.find((p) => p.id === data.productId);
        if (!product) return null;

        const batchId = generateId();
        const batch: Batch = {
          id: batchId,
          productId: data.productId,
          batchNo: data.batchNo,
          mfgDate: data.mfgDate,
          expDate: data.expDate,
          arNo: data.arNo,
          qtySampled: data.qtySampled,
          qtySampledUom: data.qtySampledUom,
          optionalTestsActivated: [],
          currentDocPhase: 'SPEC',
          createdBy: user.id,
          createdAt: now(),
          released: false,
        };

        // Create 4 placeholder BatchDocuments (all PENDING)
        const docTypes: DocType[] = ['SPEC', 'MOA', 'AWS', 'COA'];
        const docs: BatchDocument[] = docTypes.map((dt) => ({
          id: generateId(),
          batchId,
          docType: dt,
          docNo: generateDocNo(dt, product.code, data.batchNo),
          status: 'PENDING' as DocStatus,
          rejectionComments: [],
          workflowHistory: [],
        }));

        set((s) => ({
          batches: [...s.batches, batch],
          batchDocuments: [...s.batchDocuments, ...docs],
        }));

        get().addAudit('CREATE', 'BATCH', batchId, data.batchNo);
        return batch;
      },

      // ── Fetch SPEC Template ────────────────────────────────
      fetchSpecTemplate: (batchId, optionalTestIds) => {
        const user = get().currentUser;
        if (!user) return null;

        const batch = get().batches.find((b) => b.id === batchId);
        if (!batch) return null;

        const specDoc = get().batchDocuments.find(
          (d) => d.batchId === batchId && d.docType === 'SPEC'
        );
        if (!specDoc || specDoc.status !== 'PENDING') return null;

        const template = SEED_SPEC_TEMPLATES.find((t) => t.productId === batch.productId);
        if (!template) return null;

        // Update optional tests on batch
        set((s) => ({
          batches: s.batches.map((b) =>
            b.id === batchId ? { ...b, optionalTestsActivated: optionalTestIds } : b
          ),
        }));

        const updated: BatchDocument = {
          ...specDoc,
          status: 'DRAFT',
          sourceTemplateId: template.id,
          createdBy: user.id,
          workflowHistory: [
            {
              fromStatus: 'PENDING',
              toStatus: 'DRAFT',
              byUserId: user.id,
              byUserName: user.name,
              byRole: user.role,
              at: now(),
              comment: 'Template fetched from product library',
            },
          ],
        };

        set((s) => ({
          batchDocuments: s.batchDocuments.map((d) =>
            d.id === specDoc.id ? updated : d
          ),
        }));

        get().addAudit('FETCH_TEMPLATE', 'SPEC', specDoc.id, specDoc.docNo);
        return updated;
      },

      // ── Fetch MOA Template ─────────────────────────────────
      fetchMoaTemplate: (batchId) => {
        const user = get().currentUser;
        if (!user) return null;

        const batch = get().batches.find((b) => b.id === batchId);
        if (!batch) return null;

        // Ensure SPEC is QA_SIGNED
        const specDoc = get().batchDocuments.find(
          (d) => d.batchId === batchId && d.docType === 'SPEC'
        );
        if (!specDoc || specDoc.status !== 'QA_SIGNED') return null;

        const moaDoc = get().batchDocuments.find(
          (d) => d.batchId === batchId && d.docType === 'MOA'
        );
        if (!moaDoc || moaDoc.status !== 'PENDING') return null;

        const template = SEED_MOA_TEMPLATES.find((t) => t.productId === batch.productId);
        if (!template) return null;

        const updated: BatchDocument = {
          ...moaDoc,
          status: 'DRAFT',
          sourceTemplateId: template.id,
          createdBy: user.id,
          workflowHistory: [
            {
              fromStatus: 'PENDING',
              toStatus: 'DRAFT',
              byUserId: user.id,
              byUserName: user.name,
              byRole: user.role,
              at: now(),
              comment: 'MOA template fetched (SPEC is QA-signed)',
            },
          ],
        };

        set((s) => ({
          batches: s.batches.map((b) =>
            b.id === batchId ? { ...b, currentDocPhase: 'MOA' as DocType } : b
          ),
          batchDocuments: s.batchDocuments.map((d) =>
            d.id === moaDoc.id ? updated : d
          ),
        }));

        get().addAudit('FETCH_TEMPLATE', 'MOA', moaDoc.id, moaDoc.docNo);
        return updated;
      },

      // ── Start AWS ──────────────────────────────────────────
      startAws: (batchId) => {
        const user = get().currentUser;
        if (!user) return null;

        const batch = get().batches.find((b) => b.id === batchId);
        if (!batch) return null;

        // Ensure MOA is QA_SIGNED
        const moaDoc = get().batchDocuments.find(
          (d) => d.batchId === batchId && d.docType === 'MOA'
        );
        if (!moaDoc || moaDoc.status !== 'QA_SIGNED') return null;

        const awsDoc = get().batchDocuments.find(
          (d) => d.batchId === batchId && d.docType === 'AWS'
        );
        if (!awsDoc || awsDoc.status !== 'PENDING') return null;

        // Create test sections from SPEC template
        const specTemplate = SEED_SPEC_TEMPLATES.find((t) => t.productId === batch.productId);
        if (!specTemplate) return null;

        const activeTests = specTemplate.testParameters.filter(
          (tp) => tp.mandatory || batch.optionalTestsActivated.includes(tp.id)
        );

        const sections: AwsTestSection[] = activeTests.map((tp) => ({
          id: generateId(),
          batchDocumentId: awsDoc.id,
          batchId,
          testParameterId: tp.id,
          reagents: [],
          observations: '',
          inputs: {},
          status: 'NotStarted' as const,
        }));

        const updated: BatchDocument = {
          ...awsDoc,
          status: 'DRAFT',
          createdBy: user.id,
          workflowHistory: [
            {
              fromStatus: 'PENDING',
              toStatus: 'DRAFT',
              byUserId: user.id,
              byUserName: user.name,
              byRole: user.role,
              at: now(),
              comment: `AWS created with ${activeTests.length} test sections`,
            },
          ],
        };

        set((s) => ({
          batches: s.batches.map((b) =>
            b.id === batchId ? { ...b, currentDocPhase: 'AWS' as DocType } : b
          ),
          batchDocuments: s.batchDocuments.map((d) =>
            d.id === awsDoc.id ? updated : d
          ),
          awsTestSections: [...s.awsTestSections, ...sections],
        }));

        get().addAudit('CREATE', 'AWS', awsDoc.id, awsDoc.docNo);
        return updated;
      },

      // ══════════════════════════════════════════════════════
      // WORKFLOW ENGINE — dispatchTransition
      // ══════════════════════════════════════════════════════
      dispatchTransition: (documentId, toStatus, comment) => {
        const user = get().currentUser;
        if (!user) return false;

        const doc = get().batchDocuments.find((d) => d.id === documentId);
        if (!doc) return false;

        const fromStatus = doc.status;

        // ── Role-based transition validation ──
        const role = user.role;

        // QC_EXEC: DRAFT → SUBMITTED
        if (toStatus === 'SUBMITTED' && role !== 'QC_EXEC') return false;
        if (toStatus === 'SUBMITTED' && fromStatus !== 'DRAFT') return false;

        // QC_MGR: SUBMITTED → QC_APPROVED, or → REJECTED
        if (toStatus === 'QC_APPROVED' && role !== 'QC_MGR') return false;
        if (toStatus === 'QC_APPROVED' && fromStatus !== 'SUBMITTED') return false;

        // QA_MGR: QC_APPROVED → QA_SIGNED, or → REJECTED
        if (toStatus === 'QA_SIGNED' && role !== 'QA_MGR') return false;
        if (toStatus === 'QA_SIGNED' && fromStatus !== 'QC_APPROVED') return false;

        // COA: QA_MGR: AUTO_GENERATED → ISSUED
        if (toStatus === 'ISSUED' && role !== 'QA_MGR') return false;
        if (toStatus === 'ISSUED' && fromStatus !== 'AUTO_GENERATED') return false;

        // REJECTED → DRAFT (rejection by QC_MGR or QA_MGR)
        if (toStatus === 'REJECTED') {
          if (role !== 'QC_MGR' && role !== 'QA_MGR') return false;
          if (fromStatus !== 'SUBMITTED' && fromStatus !== 'QC_APPROVED') return false;
        }

        // Build workflow entry
        const entry: WorkflowEntry = {
          fromStatus,
          toStatus,
          byUserId: user.id,
          byUserName: user.name,
          byRole: user.role,
          at: now(),
          comment,
        };

        const updatedDoc: BatchDocument = {
          ...doc,
          status: toStatus === 'REJECTED' ? 'DRAFT' : toStatus,
          submittedBy: toStatus === 'SUBMITTED' ? user.id : doc.submittedBy,
          qcApprovedBy: toStatus === 'QC_APPROVED' ? user.id : doc.qcApprovedBy,
          qaSignedBy: toStatus === 'QA_SIGNED' || toStatus === 'ISSUED' ? user.id : doc.qaSignedBy,
          rejectionComments:
            toStatus === 'REJECTED' && comment
              ? [...doc.rejectionComments, comment]
              : doc.rejectionComments,
          workflowHistory: [...doc.workflowHistory, entry],
          issuedAt: toStatus === 'ISSUED' ? now() : doc.issuedAt,
        };

        set((s) => ({
          batchDocuments: s.batchDocuments.map((d) =>
            d.id === documentId ? updatedDoc : d
          ),
        }));

        // ── Determine audit action type ──
        let actionType: ActionType = 'UPDATE';
        if (toStatus === 'SUBMITTED') actionType = 'SUBMIT';
        else if (toStatus === 'QC_APPROVED') actionType = 'QC_APPROVE';
        else if (toStatus === 'QA_SIGNED') actionType = 'QA_SIGN';
        else if (toStatus === 'REJECTED') actionType = 'REJECT';
        else if (toStatus === 'ISSUED') actionType = 'ISSUE';

        get().addAudit(actionType, doc.docType, documentId, doc.docNo, 'status', fromStatus, toStatus === 'REJECTED' ? 'DRAFT' : toStatus, comment);

        // ── Auto-unlock next document on QA_SIGNED ──
        if (toStatus === 'QA_SIGNED') {
          const batch = get().batches.find((b) => b.id === doc.batchId);
          if (batch) {
            if (doc.docType === 'SPEC') {
              // Unlock MOA phase
              set((s) => ({
                batches: s.batches.map((b) =>
                  b.id === batch.id ? { ...b, currentDocPhase: 'MOA' as DocType } : b
                ),
              }));
            } else if (doc.docType === 'MOA') {
              // Unlock AWS phase
              set((s) => ({
                batches: s.batches.map((b) =>
                  b.id === batch.id ? { ...b, currentDocPhase: 'AWS' as DocType } : b
                ),
              }));
            } else if (doc.docType === 'AWS') {
              // Auto-generate COA
              get().autoGenerateCoa(batch.id);
            }
          }
        }

        // ── On COA ISSUED → mark batch as released ──
        if (toStatus === 'ISSUED' && doc.docType === 'COA') {
          set((s) => ({
            batches: s.batches.map((b) =>
              b.id === doc.batchId ? { ...b, released: true } : b
            ),
          }));
        }

        return true;
      },

      // ── AWS Section Management ─────────────────────────────
      updateAwsSection: (section) => {
        set((s) => ({
          awsTestSections: s.awsTestSections.map((sec) =>
            sec.id === section.id ? section : sec
          ),
        }));
      },

      getAwsSections: (batchDocId) => {
        return get().awsTestSections.filter((s) => s.batchDocumentId === batchDocId);
      },

      // ── COA Auto-Generation ────────────────────────────────
      autoGenerateCoa: (batchId) => {
        const user = get().currentUser;
        if (!user) return null;

        const batch = get().batches.find((b) => b.id === batchId);
        if (!batch) return null;

        const product = SEED_PRODUCTS.find((p) => p.id === batch.productId);
        if (!product) return null;

        const awsDoc = get().batchDocuments.find(
          (d) => d.batchId === batchId && d.docType === 'AWS'
        );
        if (!awsDoc || awsDoc.status !== 'QA_SIGNED') return null;

        const coaDoc = get().batchDocuments.find(
          (d) => d.batchId === batchId && d.docType === 'COA'
        );
        if (!coaDoc) return null;

        const sections = get().awsTestSections.filter((s) => s.batchDocumentId === awsDoc.id);
        const specTemplate = SEED_SPEC_TEMPLATES.find((t) => t.productId === batch.productId);

        // Build COA results from AWS sections
        const results: CoaResult[] = sections.map((sec) => {
          const tp = specTemplate?.testParameters.find((t) => t.id === sec.testParameterId);
          if (!tp) return { testName: '—', result: '—', limits: '—', conclusion: '—' };

          let limits = '—';
          if (tp.resultType === 'Quantitative') {
            if (tp.operator === 'NMT') limits = `NMT ${tp.maxValue} ${tp.uom || ''}`.trim();
            else if (tp.operator === 'NLT') limits = `NLT ${tp.minValue} ${tp.uom || ''}`.trim();
            else if (tp.operator === 'Between') limits = `${tp.minValue} – ${tp.maxValue} ${tp.uom || ''}`.trim();
          } else {
            limits = tp.acceptanceCriteria || '—';
          }

          return {
            testName: tp.name,
            result: sec.calculatedResult || sec.observations || '—',
            limits,
            conclusion: sec.conclusion || '—',
          };
        });

        const allComplies = results.every((r) => r.conclusion === 'Satisfactory');

        // Get signatures from workflow histories
        const specDoc = get().batchDocuments.find((d) => d.batchId === batchId && d.docType === 'SPEC');
        const getUser = (id?: string) => get().users.find((u) => u.id === id);

        const awsCreator = getUser(awsDoc.createdBy);
        const awsQcApprover = getUser(awsDoc.qcApprovedBy);
        const awsQaSigner = getUser(awsDoc.qaSignedBy);

        const signatures: CoaSignature[] = [
          {
            label: 'AWS CREATED BY',
            name: awsCreator?.name || '—',
            designation: 'QC Executive',
            department: 'QC',
            date: awsDoc.workflowHistory.find((h) => h.toStatus === 'DRAFT')?.at || '—',
            signed: true,
          },
          {
            label: 'AWS QC APPROVED BY',
            name: awsQcApprover?.name || '—',
            designation: 'QC Manager',
            department: 'QC',
            date: awsDoc.workflowHistory.find((h) => h.toStatus === 'QC_APPROVED')?.at || '—',
            signed: true,
          },
          {
            label: 'AWS QA SIGNED BY',
            name: awsQaSigner?.name || '—',
            designation: 'QA Manager',
            department: 'QA',
            date: awsDoc.workflowHistory.find((h) => h.toStatus === 'QA_SIGNED')?.at || '—',
            signed: true,
          },
          {
            label: 'COA QA SIGNED BY',
            name: 'Pending',
            designation: 'QA Manager',
            department: 'QA',
            date: '—',
            signed: false,
          },
        ];

        const complianceStatement = allComplies
          ? `This batch COMPLIES with Specification ${specDoc?.docNo || '—'}`
          : `This batch DOES NOT COMPLY with Specification ${specDoc?.docNo || '—'}`;

        const updated: BatchDocument = {
          ...coaDoc,
          status: 'AUTO_GENERATED',
          createdBy: 'SYSTEM',
          coaResults: results,
          complianceStatement,
          complies: allComplies,
          workflowHistory: [
            ...coaDoc.workflowHistory,
            {
              fromStatus: 'PENDING',
              toStatus: 'AUTO_GENERATED',
              byUserId: 'SYSTEM',
              byUserName: 'System',
              byRole: 'SADMIN' as Role,
              at: now(),
              comment: `COA auto-generated from QA-signed AWS ${awsDoc.docNo}`,
            },
          ],
        };

        set((s) => ({
          batches: s.batches.map((b) =>
            b.id === batchId ? { ...b, currentDocPhase: 'COA' as DocType } : b
          ),
          batchDocuments: s.batchDocuments.map((d) =>
            d.id === coaDoc.id ? updated : d
          ),
        }));

        get().addAudit('AUTO_GENERATE', 'COA', coaDoc.id, coaDoc.docNo, 'status', 'PENDING', 'AUTO_GENERATED');
        return updated;
      },

      // ── Audit Logging ──────────────────────────────────────
      addAudit: (action, docType, docId, docRef, field, prev, next, comment) => {
        const user = get().currentUser;
        const log: AuditLog = {
          id: generateId(),
          timestamp: now(),
          userId: user?.id || 'SYSTEM',
          userName: user?.name || 'System',
          role: user?.role || 'SADMIN',
          department: user?.department || 'SYSTEM',
          action,
          docType,
          docId,
          docRef,
          fieldChanged: field,
          prevValue: prev,
          newValue: next,
          comment,
        };
        set((s) => ({ auditLogs: [log, ...s.auditLogs] }));
      },

      // ── Helpers ────────────────────────────────────────────
      getBatchDocuments: (batchId) => {
        return get().batchDocuments.filter((d) => d.batchId === batchId);
      },

      getBatchDocument: (batchId, docType) => {
        return get().batchDocuments.find(
          (d) => d.batchId === batchId && d.docType === docType
        );
      },

      getProduct: (productId) => {
        return SEED_PRODUCTS.find((p) => p.id === productId);
      },

      getSpecTemplate: (productId) => {
        return SEED_SPEC_TEMPLATES.find((t) => t.productId === productId);
      },

      getMoaTemplate: (productId) => {
        return SEED_MOA_TEMPLATES.find((t) => t.productId === productId);
      },

      // ── Reset ──────────────────────────────────────────────
      resetDemoData: () => {
        set({
          currentUser: null,
          users: SEED_USERS,
          batches: SEED_BATCHES,
          batchDocuments: SEED_BATCH_DOCUMENTS,
          awsTestSections: SEED_AWS_SECTIONS,
          auditLogs: SEED_AUDIT_LOGS,
        });
      },
    }),
    {
      name: 'ac-qms-store-v2',
      // Only persist to localStorage in the browser
      skipHydration: false,
    }
  )
);
