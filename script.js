const GAS_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbydPebJnRcxXdcyOUut02BaTtQ_9mZGM0VLJub5JuwW99LgHfQf1G2ZdjbD487ZqEkY/exec';

const state = {
  todos: [],
  filter: 'all',
};

const todoList = document.getElementById('todoList');
const todoForm = document.getElementById('todoForm');
const todoInput = document.getElementById('todoInput');
const filterGroup = document.getElementById('filterGroup');
const statsText = document.getElementById('statsText');

window.addEventListener('DOMContentLoaded', () => {
  fetchInitialTodos();
  todoForm.addEventListener('submit', handleAddTodo);
  filterGroup.addEventListener('click', handleFilterChange);
});

async function fetchInitialTodos() {
  try {
    const response = await fetch('https://jsonplaceholder.typicode.com/todos?_limit=3');
    const todos = await response.json();
    state.todos = todos.map((item) => ({
      id: String(item.id),
      title: item.title,
      completed: item.completed,
    }));
    renderTodos();
  } catch (error) {
    statsText.textContent = '初始資料載入失敗，請稍後重新整理。';
    console.error('Fetch initial todos error:', error);
  }
}

function getFilteredTodos() {
  if (state.filter === 'active') {
    return state.todos.filter((todo) => !todo.completed);
  }
  if (state.filter === 'completed') {
    return state.todos.filter((todo) => todo.completed);
  }
  return state.todos;
}

function renderTodos() {
  const todos = getFilteredTodos();
  todoList.innerHTML = '';

  if (todos.length === 0) {
    todoList.innerHTML = '<li class="empty-state">目前沒有符合的任務。試試新增新任務或切換篩選條件。</li>';
  }

  todos.forEach((todo) => {
    const item = document.createElement('li');
    item.className = `todo-item${todo.completed ? ' completed' : ''}`;

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = todo.completed;
    checkbox.addEventListener('change', () => toggleTodoCompleted(todo.id));

    const label = document.createElement('label');
    label.textContent = todo.title;
    label.htmlFor = `todo-${todo.id}`;

    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.className = 'delete';
    deleteButton.textContent = '刪除';
    deleteButton.addEventListener('click', () => removeTodo(todo.id));

    item.appendChild(checkbox);
    item.appendChild(label);
    item.appendChild(deleteButton);
    todoList.appendChild(item);
  });

  const total = state.todos.length;
  const completed = state.todos.filter((todo) => todo.completed).length;
  statsText.textContent = `共 ${total} 筆任務，已完成 ${completed} 筆`;
}

function handleAddTodo(event) {
  event.preventDefault();
  const title = todoInput.value.trim();
  if (!title) return;

  const newTodo = {
    id: `todo-${Date.now()}`,
    title,
    completed: false,
  };

  state.todos.unshift(newTodo);
  todoInput.value = '';
  renderTodos();
  syncToGAS('add', newTodo);
}

function toggleTodoCompleted(id) {
  const todo = state.todos.find((item) => item.id === id);
  if (!todo) return;
  todo.completed = !todo.completed;
  renderTodos();
  syncToGAS('update', { id: todo.id, completed: todo.completed, title: todo.title });
}

function removeTodo(id) {
  state.todos = state.todos.filter((item) => item.id !== id);
  renderTodos();
  syncToGAS('delete', { id });
}

function handleFilterChange(event) {
  const button = event.target.closest('button');
  if (!button || !button.dataset.filter) return;
  state.filter = button.dataset.filter;

  filterGroup.querySelectorAll('button').forEach((btn) => btn.classList.remove('active'));
  button.classList.add('active');
  renderTodos();
}

async function syncToGAS(action, data) {
  if (!GAS_WEB_APP_URL || GAS_WEB_APP_URL.includes('YOUR_WEB_APP_ID')) {
    console.warn('請先將 GAS_WEB_APP_URL 設定為您部署後的 Web App URL。');
    return;
  }

  const payload = {
    action,
    data,
    timestamp: new Date().toISOString(),
  };

  try {
    const response = await fetch(GAS_WEB_APP_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    if (!response.ok) {
      console.error('GAS 同步失敗：', result);
    }
  } catch (error) {
    console.error('同步到 GAS 時發生錯誤：', error);
  }
}
