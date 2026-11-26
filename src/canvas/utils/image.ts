/**
 * Native file-picker helper for canvas images. Images are stored inline as
 * data URLs — no file system APIs needed.
 */
export interface PickedImage {
  src: string
  width: number
  height: number
}

function readFileAsDataUrl(file: File): Promise<string | null> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : null)
    reader.onerror = () => resolve(null)
    reader.readAsDataURL(file)
  })
}

function measure(src: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const image = new window.Image()
    image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight })
    image.onerror = () => resolve({ width: 320, height: 220 })
    image.src = src
  })
}

/** Opens the OS file dialog; resolves with a data URL and natural size. */
export function pickImageFile(): Promise<PickedImage | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.style.display = 'none'
    document.body.appendChild(input)
    const cleanup = () => {
      input.remove()
    }
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) {
        cleanup()
        resolve(null)
        return
      }
      const src = await readFileAsDataUrl(file)
      if (!src) {
        cleanup()
        resolve(null)
        return
      }
      const natural = await measure(src)
      cleanup()
      resolve({ src, width: natural.width, height: natural.height })
    }
    input.click()
  })
}
