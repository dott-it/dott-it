/**
 * Convert digitize paragraph placeholders into native Google Forms File upload items.
 *
 * NOTE: FormApp has ItemType.FILE_UPLOAD for reading, but no addFileUploadItem() —
 * Google still does not allow creating File upload questions via Apps Script or the
 * Forms REST API. This Web App is kept for experiments / future API support and for
 * reading/rewriting help text on existing FILE_UPLOAD items.
 *
 * Invoked via Web App GET ?formId=&folderId=
 *
 * @param {string} formId
 * @param {string} [folderId] Drive folder that receives student uploads
 * @return {{ converted: number, titles: string[], supported: boolean, detail?: string }}
 */
function convertFileResponseItems(formId, folderId) {
  var MARKER = '[File response]'
  var form = FormApp.openById(formId)
  var canCreate = typeof form.addFileUploadItem === 'function'
  if (!canCreate) {
    return {
      converted: 0,
      titles: [],
      supported: false,
      detail:
        'FormApp.addFileUploadItem is unavailable. Native File upload must be added in the Forms UI (or via a pre-seeded template copy).',
    }
  }

  var folder = folderId ? DriveApp.getFolderById(folderId) : null
  var jobs = []
  var items = form.getItems()

  for (var i = 0; i < items.length; i++) {
    var item = items[i]
    var title = item.getTitle() || ''
    var help = item.getHelpText() || ''
    if (title.indexOf(MARKER) === -1 && help.indexOf(MARKER) === -1) {
      continue
    }
    jobs.push({
      index: item.getIndex(),
      title: title,
      help: stripFileResponseHint_(help, MARKER),
      required: isRequired_(item),
    })
  }

  jobs.sort(function (a, b) {
    return b.index - a.index
  })
  for (var d = 0; d < jobs.length; d++) {
    form.deleteItem(jobs[d].index)
  }

  jobs.sort(function (a, b) {
    return a.index - b.index
  })
  var titles = []
  for (var c = 0; c < jobs.length; c++) {
    var job = jobs[c]
    var upload = form.addFileUploadItem()
    upload.setTitle(job.title)
    upload.setHelpText(job.help)
    upload.setRequired(job.required)
    if (folder) {
      upload.setFolder(folder)
    }
    form.moveItem(upload.getIndex(), job.index)
    titles.push(job.title)
  }

  return { converted: titles.length, titles: titles, supported: true }
}

/**
 * Web App entrypoint — query: formId, folderId?
 * Prefer GET: Apps Script POST redirects to an endpoint that returns 405.
 * @param {GoogleAppsScript.Events.DoGet} e
 * @return {GoogleAppsScript.Content.TextOutput}
 */
function doGet(e) {
  return runFromEvent_(e)
}

/**
 * @param {GoogleAppsScript.Events.DoPost} e
 * @return {GoogleAppsScript.Content.TextOutput}
 */
function doPost(e) {
  return runFromEvent_(e)
}

/**
 * @param {*} e
 * @return {GoogleAppsScript.Content.TextOutput}
 */
function runFromEvent_(e) {
  try {
    var formId = ''
    var folderId = ''
    if (e && e.parameter) {
      formId = e.parameter.formId || ''
      folderId = e.parameter.folderId || ''
    }
    if (!formId && e && e.postData && e.postData.contents) {
      var body = JSON.parse(e.postData.contents)
      formId = body.formId || ''
      folderId = body.folderId || ''
    }
    if (!formId) {
      throw new Error('Missing formId')
    }
    var result = convertFileResponseItems(formId, folderId)
    return ContentService.createTextOutput(JSON.stringify({ ok: true, result: result })).setMimeType(
      ContentService.MimeType.JSON,
    )
  } catch (error) {
    return ContentService.createTextOutput(
      JSON.stringify({
        ok: false,
        error: error && error.message ? error.message : String(error),
      }),
    ).setMimeType(ContentService.MimeType.JSON)
  }
}

function stripFileResponseHint_(helpText, marker) {
  var index = helpText.indexOf(marker)
  if (index === -1) {
    return helpText
  }
  return helpText.substring(0, index).replace(/\s+$/g, '')
}

function isRequired_(item) {
  var readers = ['asParagraphTextItem', 'asTextItem', 'asListItem', 'asMultipleChoiceItem']
  for (var i = 0; i < readers.length; i++) {
    try {
      return item[readers[i]]().isRequired()
    } catch (error) {
      // Try the next item type.
    }
  }
  return true
}
