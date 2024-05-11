import JSZip = require('jszip')
import { getMHTdocument } from './utils'
import { contentTypesXml, documentXmlRels, relsXml } from './assets'
import { documentTemplate, Orient, Margins, defaultMargins } from './templates'
import { isBrowser } from 'browser-or-node'

export type DocumentOptions = typeof defaultDocumentOptions

const defaultDocumentOptions = {
  orientation: 'portrait' as Orient,
  margins: {} as Partial<Margins>,
  height: 16838,
  width: 11906,
  size: '',
}

function mergeOptions<T>(options: T, patch: Partial<T>) {
  return { ...options, ...patch } as T
}

export async function generateDocument(zip: JSZip) {
  const buffer = await zip.generateAsync({ type: 'arraybuffer' })
  if (isBrowser) {
    return new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    })
  } else {
    return new Buffer(new Uint8Array(buffer))
  }
}

function getBinaryData(str: string) {
  return isBrowser ? new Blob([str]) : new Buffer(str, 'utf-8')
}

function renderDocumentFile(documentOptions: DocumentOptions) {
  const { orientation, margins } = documentOptions
  const marginsOptions = mergeOptions(defaultMargins, margins)

  // let width = 0
  // let height = 0
  // if (orientation === 'landscape') {
  //   height = 12240
  //   width = 15840
  // } else {
  //   width = 12240
  //   height = 15840
  // }
  const pageSizes = ['legal', 'letter', 'A4']
  let pageWidth = 11906
  let pageHeight = 16838
  if (documentOptions.height) {
    pageHeight = documentOptions.height
  }
  if (documentOptions.width) {
    pageWidth = documentOptions.width
  }
  if (documentOptions.size) {
    const a = pageSizes.indexOf(documentOptions.size)
    console.log(a)
    if (a === -1) {
      throw new Error('Size should be ' + pageSizes.toString())
    }
  } else {
    documentOptions.size = 'letter'
  }

  switch (documentOptions.size) {
    case 'legal':
      pageHeight = 20160
      pageWidth = 12240
      break
    case 'A4':
      pageHeight = 16838
      pageWidth = 11906
      break
    default:
      pageHeight = 15840
      pageWidth = 12240
  }

  // return documentTemplate(width, height, orientation, marginsOptions)
  return documentTemplate(pageWidth, pageHeight, orientation, marginsOptions)
}

export function addFiles(zip: JSZip, htmlSource: string, options: Partial<DocumentOptions>) {
  const documentOptions = mergeOptions(defaultDocumentOptions, options)
  zip.file('[Content_Types].xml', getBinaryData(contentTypesXml), {
    createFolders: false,
  })
  // @ts-ignore
  zip.folder('_rels').file('.rels', getBinaryData(relsXml), { createFolders: false })
  // @ts-ignore
  return zip
    .folder('word')
    .file('document.xml', renderDocumentFile(documentOptions), {
      createFolders: false,
    })
    .file('afchunk.mht', getMHTdocument(htmlSource), {
      createFolders: false,
    })
    .folder('_rels')
    .file('document.xml.rels', getBinaryData(documentXmlRels), {
      createFolders: false,
    })
}
