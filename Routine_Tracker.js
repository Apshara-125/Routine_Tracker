// Routine_Tracker.js

// --- Helper functions ---
function getRoutines() {
  return JSON.parse(localStorage.getItem('routines') || '[]');
}
function setRoutines(routines) {
  localStorage.setItem('routines', JSON.stringify(routines));
}

// --- DOM elements ---
const routineForm = document.getElementById('routine-form');
const routineName = document.getElementById('routine-name');
const routineDateTime = document.getElementById('routine-datetime');
const routineList = document.getElementById('routine-list');
const submitBtn = document.getElementById('submit-btn');
const cancelEditBtn = document.getElementById('cancel-edit-btn');
const filterDate = document.getElementById('filter-date');
const filterName = document.getElementById('filter-name');
const clearFilters = document.getElementById('clear-filters');

// If you have student name in the form, get this element (ignore if it's not in your form)
const studentName = document.getElementById('student-name');

let editId = null;

// --- Chart ---
let chart = null;

// --- Render Functions ---
function renderRoutines() {
  let routines = getRoutines();

  // Apply filters
  if (filterDate.value) {
    routines = routines.filter(r =>
      r.datetime.startsWith(filterDate.value)
    );
  }
  if (filterName.value) {
    routines = routines.filter(r =>
      r.name.toLowerCase().includes(filterName.value.toLowerCase())
    );
  }

  // Sort by datetime
  routines.sort((a, b) =>
    new Date(a.datetime) - new Date(b.datetime)
  );

  // Render
  routineList.innerHTML = "";
  routines.forEach(routine => {
    const li = document.createElement('li');
    li.className = "routine-item fade-in";
    li.innerHTML = `
      <span>
        <strong>${routine.name}</strong>
        <em>${new Date(routine.datetime).toLocaleString()}</em>
        ${routine.studentName ? `<small>👤 ${routine.studentName}</small>` : ""}
      </span>
      <div>
        <button class="edit-btn" data-id="${routine.id}">Edit</button>
        <button class="delete-btn" data-id="${routine.id}">Delete</button>
      </div>
    `;
    routineList.appendChild(li);
  });

  animateList();
  updateChart();
}

// --- Chart Update ---
function updateChart() {
  // We'll plot a bar graph: date (by day) vs. routine counts that day
  const routines = getRoutines();

  // Group and count by date (ignore time)
  const counts = {};
  for (const r of routines) {
    const date = r.datetime.slice(0, 10);
    counts[date] = (counts[date] || 0) + 1;
  }
  const labels = Object.keys(counts).sort();
  const data = labels.map(d => counts[d]);

  if (!document.getElementById('routineChart')) return;

  if (chart) {
    chart.data.labels = labels;
    chart.data.datasets[0].data = data;
    chart.update();
  } else {
    const ctx = document.getElementById('routineChart').getContext('2d');
    chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Routines per day',
          data,
          backgroundColor: '#7f5af0bb',
          borderRadius: 6,
          borderWidth: 0,
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
        },
        animation: {
          duration: 700,
          easing: 'easeInOutCubic'
        },
        scales: {
          y: { beginAtZero: true, ticks: { stepSize: 1 } }
        }
      }
    });
  }
}

// --- Add/Edit/Delete routines ---
routineForm.onsubmit = e => {
  e.preventDefault();
  const name = routineName.value.trim();
  const datetime = routineDateTime.value;
  // Student name field is optional: if you added it, collect its value
  const student = studentName ? studentName.value.trim() : '';

  if (!name || !datetime) return;

  let routines = getRoutines();

  if (editId) {
    // Edit
    routines = routines.map(r =>
      r.id === editId ?
        { ...r, name, datetime, ...(studentName ? {studentName: student} : {}) }
        : r
    );
  } else {
    // Add
    const newRoutine = {
      id: Date.now().toString(),
      name,
      datetime
    };
    if (studentName) newRoutine.studentName = student;
    routines.push(newRoutine);
  }
  setRoutines(routines);

  renderRoutines();
  routineForm.reset();
  editId = null;
  submitBtn.textContent = "Add Routine";
  cancelEditBtn.style.display = "none";
};

routineList.onclick = e => {
  if (e.target.classList.contains('edit-btn')) {
    const id = e.target.dataset.id;
    const routines = getRoutines();
    const routine = routines.find(r => r.id === id);
    if (routine) {
      routineName.value = routine.name;
      routineDateTime.value = routine.datetime;
      if (studentName) studentName.value = routine.studentName || '';
      editId = id;
      submitBtn.textContent = "Update Routine";
      cancelEditBtn.style.display = "inline-block";
    }
  }
  if (e.target.classList.contains('delete-btn')) {
    const id = e.target.dataset.id;
    let routines = getRoutines();
    routines = routines.filter(r => r.id !== id);
    setRoutines(routines);
    renderRoutines();
  }
};

if (cancelEditBtn) {
  cancelEditBtn.onclick = () => {
    routineForm.reset();
    editId = null;
    submitBtn.textContent = "Add Routine";
    cancelEditBtn.style.display = "none";
  };
}

// --- Filters ---
[filterDate, filterName].forEach(input => {
  input.addEventListener('input', renderRoutines);
});
if (clearFilters) {
  clearFilters.onclick = () => {
    filterDate.value = '';
    filterName.value = '';
    renderRoutines();
  };
}

// --- Animations ---
function animateList() {
  document.querySelectorAll(".routine-item").forEach((el, i) => {
    el.style.animationDelay = `${i * 75}ms`;
    el.classList.remove("fade-in");
    void el.offsetWidth; // reflow
    el.classList.add("fade-in");
  });
}

// --- On load ---
renderRoutines();

// Optional: Make renderRoutines global for Chart refresh if you use code splitting
window.renderRoutines = renderRoutines;
