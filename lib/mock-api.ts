export interface Transformer {
  id: string
  poleNo: string
  region: string
  type: "Distribution" | "Bulk"
  capacity: string
  location: string
  status: "Normal" | "Warning" | "Critical"
  lastInspection: string
  createdAt: string
  updatedAt: string
}

export interface ThermalImage {
  id: string
  transformerId: string
  filename: string
  imageType: "Baseline" | "Maintenance"
  uploaderName: string
  uploadDate: string
  comments?: string
  environmentalCondition?: "Sunny" | "Cloudy" | "Rainy"
  fileSize: number
  url: string
}

// Mock data store
const transformersStore: Transformer[] = [
  {
    id: "AZ-8890",
    poleNo: "EN-123-B",
    region: "Maharagama",
    type: "Distribution",
    capacity: "100 kVA",
    location: "Maharagama Junction, Main Road",
    status: "Normal",
    lastInspection: "2023-05-21T12:55:00Z",
    createdAt: "2023-01-15T08:00:00Z",
    updatedAt: "2023-05-21T12:55:00Z",
  },
  {
    id: "AZ-1649",
    poleNo: "EN-124-A",
    region: "Nugegoda",
    type: "Distribution",
    capacity: "63 kVA",
    location: "Nugegoda Town Center",
    status: "Warning",
    lastInspection: "2023-05-22T09:30:00Z",
    createdAt: "2023-01-20T10:00:00Z",
    updatedAt: "2023-05-22T09:30:00Z",
  },
  {
    id: "AZ-7316",
    poleNo: "EN-125-C",
    region: "Colombo",
    type: "Bulk",
    capacity: "500 kVA",
    location: "Colombo Fort Railway Station",
    status: "Critical",
    lastInspection: "2023-05-23T14:15:00Z",
    createdAt: "2023-02-01T09:00:00Z",
    updatedAt: "2023-05-23T14:15:00Z",
  },
  {
    id: "AZ-4613",
    poleNo: "EN-126-D",
    region: "Dehiwala",
    type: "Distribution",
    capacity: "160 kVA",
    location: "Dehiwala Beach Road",
    status: "Normal",
    lastInspection: "2023-05-24T10:45:00Z",
    createdAt: "2023-02-10T11:00:00Z",
    updatedAt: "2023-05-24T10:45:00Z",
  },
  {
    id: "AX-8993",
    poleNo: "EN-127-E",
    region: "Mount Lavinia",
    type: "Bulk",
    capacity: "315 kVA",
    location: "Mount Lavinia Hotel Area",
    status: "Normal",
    lastInspection: "2023-05-25T15:20:00Z",
    createdAt: "2023-02-15T12:00:00Z",
    updatedAt: "2023-05-25T15:20:00Z",
  },
  {
    id: "AY-8790",
    poleNo: "EN-128-F",
    region: "Ratmalana",
    type: "Distribution",
    capacity: "100 kVA",
    location: "Ratmalana Airport Road",
    status: "Warning",
    lastInspection: "2023-05-26T11:15:00Z",
    createdAt: "2023-02-20T13:00:00Z",
    updatedAt: "2023-05-26T11:15:00Z",
  },
]

let thermalImagesStore: ThermalImage[] = []

// Simulate API delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// Transformer CRUD operations
export const transformerApi = {
  async getAll(): Promise<Transformer[]> {
    await delay(300)
    return [...transformersStore]
  },

  async getById(id: string): Promise<Transformer | null> {
    await delay(200)
    return transformersStore.find((t) => t.id === id) || null
  },

  async create(transformer: Omit<Transformer, "createdAt" | "updatedAt">): Promise<Transformer> {
    await delay(500)
    const now = new Date().toISOString()
    const newTransformer: Transformer = {
      ...transformer,
      createdAt: now,
      updatedAt: now,
    }
    transformersStore.push(newTransformer)
    return newTransformer
  },

  async update(id: string, updates: Partial<Transformer>): Promise<Transformer | null> {
    await delay(500)
    const index = transformersStore.findIndex((t) => t.id === id)
    if (index === -1) return null

    const updatedTransformer = {
      ...transformersStore[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    }
    transformersStore[index] = updatedTransformer
    return updatedTransformer
  },

  async delete(id: string): Promise<boolean> {
    await delay(300)
    const index = transformersStore.findIndex((t) => t.id === id)
    if (index === -1) return false

    transformersStore.splice(index, 1)
    // Also delete associated images
    thermalImagesStore = thermalImagesStore.filter((img) => img.transformerId !== id)
    return true
  },
}

// Thermal Image CRUD operations
export const thermalImageApi = {
  async getAll(): Promise<ThermalImage[]> {
    await delay(300)
    return [...thermalImagesStore]
  },

  async getByTransformerId(transformerId: string): Promise<ThermalImage[]> {
    await delay(200)
    return thermalImagesStore.filter((img) => img.transformerId === transformerId)
  },

  async create(image: Omit<ThermalImage, "id">): Promise<ThermalImage> {
    await delay(800) // Simulate upload time
    const newImage: ThermalImage = {
      ...image,
      id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    }
    thermalImagesStore.push(newImage)
    return newImage
  },

  async delete(id: string): Promise<boolean> {
    await delay(300)
    const index = thermalImagesStore.findIndex((img) => img.id === id)
    if (index === -1) return false

    thermalImagesStore.splice(index, 1)
    return true
  },
}

// Statistics API
export const statsApi = {
  async getDashboardStats() {
    await delay(200)
    const total = transformersStore.length
    const normal = transformersStore.filter((t) => t.status === "Normal").length
    const warning = transformersStore.filter((t) => t.status === "Warning").length
    const critical = transformersStore.filter((t) => t.status === "Critical").length

    return {
      totalTransformers: 1428, // Mock larger number
      operationalTransformers: 1420,
      pendingInspections: 59,
      criticalAlerts: critical,
      inspectionsToday: 12,
      maintenanceCompleted: 8,
      statusDistribution: {
        normal: normal,
        warning: warning,
        critical: critical,
      },
    }
  },
}
