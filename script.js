const TEACHER_PIN_CODE = "d3P3d-2026";

// --- WELCOME & SECURITY ROUTING ---
function proceedToLogin() {
  document.getElementById('welcomeContainer').style.display = 'none';
  document.getElementById('loginFormsContainer').style.display = 'grid';
}

function verifyTeacherCode() {
  const code = prompt("Please enter the Teacher Access Code (PIN):");
  if (code === TEACHER_PIN_CODE) {
    document.getElementById('teacherAuthPrompt').style.display = 'none';
    document.getElementById('teacherLoginForm').style.display = 'block';
  } else {
    alert("Incorrect Access Code!");
  }
}

// --- LOGIN HANDLERS (MAX 30 STUDENTS LIMIT) ---
function handleStudentLogin(e) {
  e.preventDefault();
  
  let registeredStudents = JSON.parse(localStorage.getItem('registered_students')) || [];
  const gemail = document.getElementById('studGoogle').value.trim();
  const name = document.getElementById('studName').value.trim();
  const pass = document.getElementById('studPass').value.trim();
  const sec = document.getElementById('studSec').value.trim();

  const existingUser = registeredStudents.find(s => s.gemail === gemail);
  if (!existingUser && registeredStudents.length >= 30) {
    alert("Portal is full! Registration is limited to 30 students only.");
    return;
  }

  if (!existingUser) {
    registeredStudents.push({ gemail, name, pass, sec });
    localStorage.setItem('registered_students', JSON.stringify(registeredStudents));
  }

  localStorage.setItem('current_user_role', 'student');
  localStorage.setItem('current_student_name', name);
  window.location.href = 'studentpage.html';
}

function handleTeacherLogin(e) {
  e.preventDefault();
  localStorage.setItem('current_user_role', 'teacher');
  window.location.href = 'teacherpage.html';
}

function logoutUser(e) {
  if (e) e.preventDefault();
  localStorage.removeItem('current_user_role');
  localStorage.removeItem('current_student_name');
  window.location.href = 'logIn.html';
}

// --- DYNAMIC DEADLINE THEME EVALUATOR ---
function getDeadlineClass(deadlineDateStr) {
  if (!deadlineDateStr) return "";
  const now = new Date();
  const deadline = new Date(deadlineDateStr);
  const diffTime = deadline - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays <= 7) return "deadline-red";      // 1 week or less
  if (diffDays <= 21) return "deadline-yellow"; // 3 weeks
  return "deadline-green";                      // 1 month or more
}

// --- STUDENT DASHBOARD LOGIC ---
function loadStudentPage() {
  const tasks = JSON.parse(localStorage.getItem('teacher_tasks')) || [];
  const currentStudent = localStorage.getItem('current_student_name') || 'Student';
  const completedMap = JSON.parse(localStorage.getItem('student_completed_tasks')) || {};
  const myCompleted = completedMap[currentStudent] || [];

  const categories = ['Project', 'WrittenWorks', 'Module', 'Quiz', 'Summative', 'Exam'];
  
  categories.forEach(cat => {
    const el = document.getElementById(`stud-cat-${cat}`);
    if (el) el.innerHTML = '';
  });

  const doneContainer = document.getElementById('stud-done-list');
  if (doneContainer) doneContainer.innerHTML = '';

  tasks.forEach((task, index) => {
    const isDone = myCompleted.includes(index);
    const deadlineClass = getDeadlineClass(task.deadline);

    if (isDone) {
      if (doneContainer) {
        doneContainer.innerHTML += `
          <div style="text-decoration: line-through; padding: 10px; border-bottom:1px solid #ddd;">
            <strong>[${task.category}]</strong> ${task.title} (Completed)
          </div>`;
      }
    } else {
      const targetCatEl = document.getElementById(`stud-cat-${task.category}`);
      if (targetCatEl) {
        targetCatEl.innerHTML += `
          <div style="margin-bottom: 12px; padding: 12px; background: rgba(0,0,0,0.03); border-radius:6px;">
            <input type="checkbox" onchange="markTaskDone(${index})"> 
            <strong>${task.title}</strong>
            <br><small class="${deadlineClass}">⏳ Deadline: ${task.deadline}</small>
          </div>`;
      }
    }
  });

  checkNotifications();
}

function markTaskDone(taskIndex) {
  const currentStudent = localStorage.getItem('current_student_name') || 'Student';
  let completedMap = JSON.parse(localStorage.getItem('student_completed_tasks')) || {};

  if (!completedMap[currentStudent]) completedMap[currentStudent] = [];
  if (!completedMap[currentStudent].includes(taskIndex)) {
    completedMap[currentStudent].push(taskIndex);
  }

  localStorage.setItem('student_completed_tasks', JSON.stringify(completedMap));
  loadStudentPage();
}

// --- TEACHER CONTROL CENTER ---
function loadTeacherPage() {
  const tasks = JSON.parse(localStorage.getItem('teacher_tasks')) || [];
  const categories = ['Project', 'WrittenWorks', 'Module', 'Quiz', 'Summative', 'Exam'];

  categories.forEach(cat => {
    const el = document.getElementById(`teach-cat-${cat}`);
    if (el) el.innerHTML = '';
  });

  tasks.forEach((task, index) => {
    const targetCatEl = document.getElementById(`teach-cat-${task.category}`);
    const deadlineClass = getDeadlineClass(task.deadline);
    if (targetCatEl) {
      targetCatEl.innerHTML += `
        <div style="margin-bottom: 10px; padding: 10px; background: rgba(255,255,255,0.05); border-radius:6px;">
          <strong>${task.title}</strong>
          <br><small class="${deadlineClass}">⏳ ${task.deadline}</small>
          <br><button onclick="deleteTask(${index})" class="btn btn-danger" style="padding:2px 8px; font-size:12px; margin-top:5px;">Delete</button>
        </div>`;
    }
  });

  renderTeacherStudentChecker();
}

function addNewTask(e) {
  e.preventDefault();
  const category = document.getElementById('taskCategory').value;
  const title = document.getElementById('taskTitle').value.trim();
  const deadline = document.getElementById('taskDeadline').value;

  let tasks = JSON.parse(localStorage.getItem('teacher_tasks')) || [];
  tasks.push({ category, title, deadline });
  localStorage.setItem('teacher_tasks', JSON.stringify(tasks));
  localStorage.setItem('has_new_task_notif', 'true');

  document.getElementById('taskTitle').value = '';
  loadTeacherPage();
}

function deleteTask(index) {
  let tasks = JSON.parse(localStorage.getItem('teacher_tasks')) || [];
  tasks.splice(index, 1);
  localStorage.setItem('teacher_tasks', JSON.stringify(tasks));
  loadTeacherPage();
}

// --- TEACHER ROSTER & EXAM CHECKER ---
function addStudentToRoster(e) {
  e.preventDefault();
  const name = document.getElementById('rosterName').value.trim();
  if (!name) return;

  let roster = JSON.parse(localStorage.getItem('teacher_roster')) || [];
  roster.push({ name, tookSummative: false, tookExam: false });
  localStorage.setItem('teacher_roster', JSON.stringify(roster));
  
  document.getElementById('rosterName').value = '';
  renderTeacherStudentChecker();
}

function toggleExamCheck(index, field) {
  let roster = JSON.parse(localStorage.getItem('teacher_roster')) || [];
  roster[index][field] = !roster[index][field];
  localStorage.setItem('teacher_roster', JSON.stringify(roster));
  renderTeacherStudentChecker();
}

function renderTeacherStudentChecker() {
  const roster = JSON.parse(localStorage.getItem('teacher_roster')) || [];
  const tbody = document.getElementById('teacherCheckerBody');
  if (!tbody) return;

  tbody.innerHTML = '';
  roster.forEach((stud, i) => {
    tbody.innerHTML += `
      <tr>
        <td>${stud.name}</td>
        <td><input type="checkbox" ${stud.tookSummative ? 'checked' : ''} onchange="toggleExamCheck(${i}, 'tookSummative')"> Took Summative</td>
        <td><input type="checkbox" ${stud.tookExam ? 'checked' : ''} onchange="toggleExamCheck(${i}, 'tookExam')"> Took Exam</td>
      </tr>`;
  });
}

// --- AUTOMATIC NOTIFICATIONS CHECKER ---
function checkNotifications() {
  const currentStudent = localStorage.getItem('current_student_name');
  const roster = JSON.parse(localStorage.getItem('teacher_roster')) || [];
  const notifBox = document.getElementById('studentNotifBox');
  
  if (!notifBox || !currentStudent) return;

  let alerts = [];

  if (localStorage.getItem('has_new_task_notif') === 'true') {
    alerts.push("📢 A new task has been added by your teacher!");
  }

  const myRecord = roster.find(r => r.name.toLowerCase() === currentStudent.toLowerCase());
  if (myRecord) {
    if (!myRecord.tookSummative) alerts.push("⚠️ You have NOT taken the Summative Test yet!");
    if (!myRecord.tookExam) alerts.push("⚠️ You have NOT taken the Major Exam yet!");
  }

  if (alerts.length > 0) {
    notifBox.style.display = 'block';
    notifBox.innerHTML = alerts.join('<br>');
  } else {
    notifBox.style.display = 'none';
  }
}

// --- CONTACT PAGES VIEW LOADERS ---
function loadStudentContactView() {
  const currentStudent = localStorage.getItem('current_student_name') || 'Student';
  const completedMap = JSON.parse(localStorage.getItem('student_completed_tasks')) || {};
  const tasks = JSON.parse(localStorage.getItem('teacher_tasks')) || [];
  const myCompletedIndices = completedMap[currentStudent] || [];

  const tbody = document.getElementById('studentCompletedContactBody');
  if (!tbody) return;

  tbody.innerHTML = '';
  myCompletedIndices.forEach(idx => {
    if (tasks[idx]) {
      tbody.innerHTML += `<tr><td>${tasks[idx].category}</td><td>${tasks[idx].title}</td><td>Completed</td></tr>`;
    }
  });
}

function loadTeacherContactView() {
  const completedMap = JSON.parse(localStorage.getItem('student_completed_tasks')) || {};
  const roster = JSON.parse(localStorage.getItem('teacher_roster')) || [];
  const tasks = JSON.parse(localStorage.getItem('teacher_tasks')) || [];

  const matrixBody = document.getElementById('teacherMatrixBody');
  const pendingBody = document.getElementById('teacherViewPendingBody');

  if (matrixBody) {
    matrixBody.innerHTML = '';
    
    for (let studentName in completedMap) {
      const studentTasks = completedMap[studentName].map(i => tasks[i] ? tasks[i].category : '');

      matrixBody.innerHTML += `
        <tr>
          <td>${studentName}</td>
          <td>${studentTasks.includes('Quiz') ? '✓' : '❌'}</td>
          <td>${studentTasks.includes('Summative') ? '✓' : '❌'}</td>
          <td>${studentTasks.includes('Module') ? '✓' : '❌'}</td>
          <td>${studentTasks.includes('Project') ? '✓' : '❌'}</td>
          <td>${studentTasks.includes('WrittenWorks') ? '✓' : '❌'}</td>
          <td>${studentTasks.includes('Exam') ? '✓' : '❌'}</td>
        </tr>`;
    }
  }

  if (pendingBody) {
    pendingBody.innerHTML = '';
    roster.forEach(r => {
      let missing = [];
      if (!r.tookSummative) missing.push('Summative');
      if (!r.tookExam) missing.push('Exam');

      if (missing.length > 0) {
        pendingBody.innerHTML += `<tr><td>${r.name}</td><td>Pending: ${missing.join(', ')}</td></tr>`;
      }
    });
  }
}
