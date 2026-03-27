export interface Character {
  id: string
  name: string
  description: string
  visualAttributes: {
    proportions: string
    facialFeatures: string
    lineStyle: string
    colorPalette: string[]
    hairStyle: string
    eyeShape: string
  }
  thumbnailDataUrl?: string
  createdAt: Date
  updatedAt: Date
}
