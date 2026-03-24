import { useState } from 'react';
import {
  getKnowledgeWorkflowApi,
  scanKnowledgeWorkflowApi,
  uploadKnowledgeRawFilesApi,
  deleteKnowledgeRawFileApi,
  buildKnowledgeWorkflowApi,
  validateKnowledgeWorkflowApi,
  registerKnowledgeDocumentApi,
  updateKnowledgeDocumentApi,
  deleteKnowledgeDocumentApi
} from 'model/adminKnowledgeApi';

function extractApiError(err, fallback) {
  const data = err?.response?.data;
  if (typeof data === 'string' && data.trim()) return data;
  if (typeof data?.error === 'string' && data.error.trim()) return data.error;
  if (typeof data?.message === 'string' && data.message.trim()) return data.message;
  return fallback;
}

export function useKnowledgeWorkflowViewModel() {
  const [workflow, setWorkflow] = useState(null);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [uploadingRawFiles, setUploadingRawFiles] = useState(false);
  const [deletingRawFile, setDeletingRawFile] = useState(false);
  const [building, setBuilding] = useState(false);
  const [validating, setValidating] = useState(false);
  const [savingDocument, setSavingDocument] = useState(false);
  const [deletingDocument, setDeletingDocument] = useState(false);

  const fetchWorkflow = async () => {
    setLoading(true);
    try {
      const res = await getKnowledgeWorkflowApi();
      const payload = res?.data || null;
      setWorkflow(payload);
      return { success: true, data: payload };
    } catch (err) {
      return { success: false, error: extractApiError(err, 'Failed to load knowledge workflow.') };
    } finally {
      setLoading(false);
    }
  };

  const scanWorkflow = async () => {
    setScanning(true);
    try {
      const res = await scanKnowledgeWorkflowApi();
      const payload = res?.data || null;
      setWorkflow(payload);
      return { success: true, data: payload };
    } catch (err) {
      return { success: false, error: extractApiError(err, 'Failed to scan the raw knowledge folder.') };
    } finally {
      setScanning(false);
    }
  };

  const buildWorkflow = async () => {
    setBuilding(true);
    try {
      const res = await buildKnowledgeWorkflowApi();
      const payload = res?.data || null;
      setWorkflow(payload);
      return { success: true, data: payload };
    } catch (err) {
      return { success: false, error: extractApiError(err, 'Failed to build the local knowledge corpus.') };
    } finally {
      setBuilding(false);
    }
  };

  const uploadRawFiles = async (files) => {
    setUploadingRawFiles(true);
    try {
      const formData = new FormData();
      Array.from(files || []).forEach((file) => formData.append('files', file));
      const res = await uploadKnowledgeRawFilesApi(formData);
      const payload = res?.data || null;
      const workflowPayload = payload?.workflow || null;
      if (workflowPayload) setWorkflow(workflowPayload);
      return { success: true, data: payload };
    } catch (err) {
      return { success: false, error: extractApiError(err, 'Failed to upload raw PDF files.') };
    } finally {
      setUploadingRawFiles(false);
    }
  };

  const validateWorkflow = async () => {
    setValidating(true);
    try {
      const res = await validateKnowledgeWorkflowApi();
      const payload = res?.data || null;
      setWorkflow(payload);
      return { success: true, data: payload };
    } catch (err) {
      return { success: false, error: extractApiError(err, 'Failed to validate the local knowledge corpus.') };
    } finally {
      setValidating(false);
    }
  };

  const deleteRawFile = async (filename) => {
    setDeletingRawFile(true);
    try {
      const res = await deleteKnowledgeRawFileApi(filename);
      const payload = res?.data || null;
      setWorkflow(payload);
      return { success: true, data: payload };
    } catch (err) {
      return { success: false, error: extractApiError(err, 'Failed to remove the raw PDF file.') };
    } finally {
      setDeletingRawFile(false);
    }
  };

  const registerDocument = async (payload) => {
    setSavingDocument(true);
    try {
      const res = await registerKnowledgeDocumentApi(payload);
      const nextPayload = res?.data || null;
      setWorkflow(nextPayload);
      return { success: true, data: nextPayload };
    } catch (err) {
      return { success: false, error: extractApiError(err, 'Failed to register the raw PDF.') };
    } finally {
      setSavingDocument(false);
    }
  };

  const updateDocument = async (documentId, payload) => {
    setSavingDocument(true);
    try {
      const res = await updateKnowledgeDocumentApi(documentId, payload);
      const nextPayload = res?.data || null;
      setWorkflow(nextPayload);
      return { success: true, data: nextPayload };
    } catch (err) {
      return { success: false, error: extractApiError(err, 'Failed to update the knowledge document.') };
    } finally {
      setSavingDocument(false);
    }
  };

  const deleteDocument = async (documentId) => {
    setDeletingDocument(true);
    try {
      const res = await deleteKnowledgeDocumentApi(documentId);
      const nextPayload = res?.data || null;
      setWorkflow(nextPayload);
      return { success: true, data: nextPayload };
    } catch (err) {
      return { success: false, error: extractApiError(err, 'Failed to remove the knowledge document.') };
    } finally {
      setDeletingDocument(false);
    }
  };

  return {
    workflow,
    loading,
    scanning,
    uploadingRawFiles,
    deletingRawFile,
    building,
    validating,
    savingDocument,
    deletingDocument,
    fetchWorkflow,
    scanWorkflow,
    uploadRawFiles,
    deleteRawFile,
    buildWorkflow,
    validateWorkflow,
    registerDocument,
    updateDocument,
    deleteDocument
  };
}

export default useKnowledgeWorkflowViewModel;
