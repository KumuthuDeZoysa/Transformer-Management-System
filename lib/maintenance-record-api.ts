// Maintenance Record API calls for Phase 4
import { MaintenanceRecord, CreateMaintenanceRecordRequest, UpdateMaintenanceRecordRequest } from './types'
import { tokenManager } from './jwt-token'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080/api'

export const maintenanceRecordApi = {
  // Get all maintenance records
  async getAll(): Promise<MaintenanceRecord[]> {
    const response = await fetch(`${BACKEND_URL}/maintenance-records`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...tokenManager.getAuthHeader(),
      },
    })

    if (!response.ok) {
      throw new Error('Failed to fetch maintenance records')
    }

    return response.json()
  },

  // Get a single maintenance record by ID
  async getById(id: string): Promise<MaintenanceRecord> {
    const response = await fetch(`${BACKEND_URL}/maintenance-records/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...tokenManager.getAuthHeader(),
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch maintenance record: ${id}`)
    }

    return response.json()
  },

  // Get maintenance record by inspection ID
  async getByInspectionId(inspectionId: string): Promise<MaintenanceRecord | null> {
    const response = await fetch(`${BACKEND_URL}/maintenance-records/inspection/${inspectionId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...tokenManager.getAuthHeader(),
      },
    })

    if (response.status === 404) {
      return null
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch maintenance record for inspection: ${inspectionId}`)
    }

    return response.json()
  },

  // Get all maintenance records for a transformer
  async getByTransformerId(transformerId: string): Promise<MaintenanceRecord[]> {
    const response = await fetch(`${BACKEND_URL}/maintenance-records/transformer/${transformerId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...tokenManager.getAuthHeader(),
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch maintenance records for transformer: ${transformerId}`)
    }

    return response.json()
  },

  // Create a new maintenance record
  async create(data: CreateMaintenanceRecordRequest): Promise<MaintenanceRecord> {
    const response = await fetch(`${BACKEND_URL}/maintenance-records`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...tokenManager.getAuthHeader(),
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to create maintenance record' }))
      throw new Error(error.message || 'Failed to create maintenance record')
    }

    return response.json()
  },

  // Update an existing maintenance record
  async update(id: string, data: UpdateMaintenanceRecordRequest): Promise<MaintenanceRecord> {
    const response = await fetch(`${BACKEND_URL}/maintenance-records/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...tokenManager.getAuthHeader(),
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to update maintenance record' }))
      throw new Error(error.message || 'Failed to update maintenance record')
    }

    return response.json()
  },

  // Delete a maintenance record
  async delete(id: string): Promise<void> {
    const response = await fetch(`${BACKEND_URL}/maintenance-records/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...tokenManager.getAuthHeader(),
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to delete maintenance record: ${id}`)
    }
  },
}
