function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  const payload = parsePayload(e);
  if (!payload) {
    return jsonResponse({
      status: 'error',
      message: '無效的請求內容',
    });
  }

  const { action, data } = payload;
  const sheet = getTodoSheet();

  if (action === 'add') {
    appendTodoRow(sheet, data);
    return jsonResponse({ status: 'success', action: 'add' });
  }

  if (action === 'update') {
    const updated = updateTodoRow(sheet, data);
    return jsonResponse({ status: updated ? 'success' : 'not_found', action: 'update' });
  }

  if (action === 'delete') {
    const deleted = deleteTodoRow(sheet, data.id);
    return jsonResponse({ status: deleted ? 'success' : 'not_found', action: 'delete' });
  }

  return jsonResponse({ status: 'error', message: '未知的 action' });
}

function parsePayload(e) {
  try {
    if (e.postData && e.postData.contents) {
      return JSON.parse(e.postData.contents);
    }
    if (e.parameter && e.parameter.payload) {
      return JSON.parse(e.parameter.payload);
    }
    return null;
  } catch (error) {
    return null;
  }
}

function getTodoSheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName('Todos');
  if (!sheet) {
    sheet = spreadsheet.insertSheet('Todos');
    sheet.appendRow(['Task ID', 'Task Title', 'Completed', 'Created At']);
  }
  return sheet;
}

function appendTodoRow(sheet, todo) {
  sheet.appendRow([
    todo.id || '',
    todo.title || '',
    todo.completed ? 'TRUE' : 'FALSE',
    new Date(),
  ]);
}

function updateTodoRow(sheet, todo) {
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i += 1) {
    if (String(rows[i][0]) === String(todo.id)) {
      sheet.getRange(i + 1, 3).setValue(todo.completed ? 'TRUE' : 'FALSE');
      if (todo.title) {
        sheet.getRange(i + 1, 2).setValue(todo.title);
      }
      return true;
    }
  }
  return false;
}

function deleteTodoRow(sheet, taskId) {
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i += 1) {
    if (String(rows[i][0]) === String(taskId)) {
      sheet.deleteRow(i + 1);
      return true;
    }
  }
  return false;
}

function jsonResponse(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
