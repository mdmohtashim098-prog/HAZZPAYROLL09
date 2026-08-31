/* =========================================================
   WORKERTRACK
   Attendance + Hours + Payroll Management
   ========================================================= */


/* ================= DATA ================= */

let workers =
    JSON.parse(localStorage.getItem("workertrack_workers")) || [];

let attendance =
    JSON.parse(localStorage.getItem("workertrack_attendance")) || [];


/* ================= HELPERS ================= */

const $ = (id) => document.getElementById(id);


function saveData() {

    localStorage.setItem(
        "workertrack_workers",
        JSON.stringify(workers)
    );

    localStorage.setItem(
        "workertrack_attendance",
        JSON.stringify(attendance)
    );
}


function generateId(prefix = "ID") {

    return (
        prefix +
        "-" +
        Date.now().toString(36).toUpperCase() +
        Math.random()
            .toString(36)
            .substring(2, 6)
            .toUpperCase()
    );

}


function getToday() {

    const date = new Date();

    const year = date.getFullYear();

    const month =
        String(date.getMonth() + 1).padStart(2, "0");

    const day =
        String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}


function formatDate(dateString) {

    if (!dateString) return "-";

    const date = new Date(dateString + "T00:00:00");

    return date.toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );

}


function formatCurrency(amount) {

    return "₹" +
        Number(amount || 0).toLocaleString(
            "en-IN",
            {
                maximumFractionDigits: 2
            }
        );

}


/* ================= TIME CALCULATION ================= */

/*
    Converts HH:MM into minutes.

    Example:
    08:30 => 510 minutes
*/

function timeToMinutes(time) {

    if (!time) return null;

    const [hours, minutes] =
        time.split(":").map(Number);

    return hours * 60 + minutes;
}


/*
    Calculates one shift.

    Important:
    If end time is earlier than start time,
    we assume the shift crossed midnight.

    Example:
    22:00 -> 02:00 = 4 hours
*/

function calculateShift(start, end) {

    if (!start || !end) return 0;

    let startMinutes =
        timeToMinutes(start);

    let endMinutes =
        timeToMinutes(end);

    if (
        startMinutes === null ||
        endMinutes === null
    ) {
        return 0;
    }

    let difference =
        endMinutes - startMinutes;

    // Cross midnight
    if (difference < 0) {

        difference += 24 * 60;

    }

    return difference;
}


/*
    Calculates total minutes from both shifts.
*/

function calculateTotalMinutes(data) {

    const shift1 =
        calculateShift(
            data.shift1Start,
            data.shift1End
        );

    const shift2 =
        calculateShift(
            data.shift2Start,
            data.shift2End
        );

    return shift1 + shift2;
}


function formatMinutes(totalMinutes) {

    const hours =
        Math.floor(totalMinutes / 60);

    const minutes =
        totalMinutes % 60;

    return `${hours}h ${minutes}m`;
}


/*
    Decimal hours are only used internally
    for payment calculation.

    Example:
    8h 30m = 8.5 hours
*/

function minutesToDecimalHours(minutes) {

    return minutes / 60;

}


/* ================= NAVIGATION ================= */

const navItems =
    document.querySelectorAll(".nav-item[data-page]");

const pages =
    document.querySelectorAll(".page");

function showPage(pageName) {

    pages.forEach(page => {

        page.classList.remove("active-page");

    });


    const selected =
        $(pageName);

    if (selected) {

        selected.classList.add("active-page");

    }


    navItems.forEach(item => {

        item.classList.remove("active");

        if (
            item.dataset.page === pageName
        ) {

            item.classList.add("active");

        }

    });


    if (pageName === "workers") {
        renderWorkers();
    }

    if (pageName === "attendance") {
        renderAttendance();
    }

    if (pageName === "payments") {
        renderPayments();
    }

    if (pageName === "reports") {
        renderReports();
    }

}


document.addEventListener(
    "click",
    function (event) {

        const button =
            event.target.closest("[data-page]");

        if (!button) return;

        showPage(button.dataset.page);

    }
);


/* ================= MOBILE MENU ================= */

$("menuBtn").addEventListener(
    "click",
    () => {

        document
            .querySelector(".sidebar")
            .classList.toggle("open");

    }
);


/* ================= WORKER MODAL ================= */

function openWorkerModal(worker = null) {

    $("workerModal").classList.add("show");

    if (worker) {

        $("workerModalTitle").textContent =
            "Edit Worker";

        $("editWorkerId").value =
            worker.id;

        $("workerName").value =
            worker.name;

        $("workerId").value =
            worker.workerId;

        $("workerPhone").value =
            worker.phone || "";

        $("workerRate").value =
            worker.rate;

    } else {

        $("workerModalTitle").textContent =
            "Add Worker";

        $("workerForm").reset();

        $("editWorkerId").value = "";

    }

}


function closeModal(id) {

    $(id).classList.remove("show");

}


document.addEventListener(
    "click",
    function (event) {

        const close =
            event.target.closest("[data-close]");

        if (!close) return;

        closeModal(close.dataset.close);

    }
);


/* Dashboard Add Worker */

$("dashboardAddWorker")
    .addEventListener(
        "click",
        () => openWorkerModal()
    );


$("addWorkerBtn")
    .addEventListener(
        "click",
        () => openWorkerModal()
    );


/* ================= SAVE WORKER ================= */

$("workerForm")
    .addEventListener(
        "submit",
        function (event) {

            event.preventDefault();


            const editingId =
                $("editWorkerId").value;


            const name =
                $("workerName").value.trim();

            const workerId =
                $("workerId").value.trim();

            const phone =
                $("workerPhone").value.trim();

            const rate =
                Number($("workerRate").value);


            if (!name || !workerId || rate < 0) {

                showToast(
                    "Please enter valid worker details."
                );

                return;

            }


            // Check duplicate worker ID

            const duplicate =
                workers.find(
                    worker =>
                        worker.workerId.toLowerCase() ===
                        workerId.toLowerCase() &&
                        worker.id !== editingId
                );


            if (duplicate) {

                showToast(
                    "Worker ID already exists."
                );

                return;

            }


            if (editingId) {

                const worker =
                    workers.find(
                        w => w.id === editingId
                    );


                if (worker) {

                    worker.name = name;
                    worker.workerId = workerId;
                    worker.phone = phone;
                    worker.rate = rate;

                }


                showToast(
                    "Worker updated successfully."
                );

            } else {

                workers.push({

                    id: generateId("W"),

                    name,

                    workerId,

                    phone,

                    rate,

                    createdAt:
                        new Date().toISOString()

                });


                showToast(
                    "Worker added successfully."
                );

            }


            saveData();

            closeModal("workerModal");

            renderAll();

        }
    );


/* ================= WORKERS RENDER ================= */

function renderWorkers() {

    const container =
        $("workersGrid");

    const search =
        $("workerSearch").value
            .trim()
            .toLowerCase();


    const filtered =
        workers.filter(worker =>

            worker.name
                .toLowerCase()
                .includes(search)

            ||

            worker.workerId
                .toLowerCase()
                .includes(search)

        );


    if (!filtered.length) {

        container.innerHTML = `

            <div class="card empty-state"
                 style="grid-column:1/-1">

                <i class="fa-solid fa-users"></i>

                <strong>
                    No workers found
                </strong>

                <span>
                    Add your first worker to get started.
                </span>

            </div>

        `;

        return;

    }


    container.innerHTML =
        filtered.map(worker => {

            const initials =
                worker.name
                    .split(" ")
                    .map(word => word[0])
                    .join("")
                    .substring(0, 2)
                    .toUpperCase();


            return `

                <div class="worker-card">

                    <div class="worker-card-top">

                        <div>

                            <div class="big-avatar">
                                ${initials}
                            </div>

                            <h3>
                                ${escapeHTML(worker.name)}
                            </h3>

                            <div class="worker-card-id">
                                ${escapeHTML(worker.workerId)}
                            </div>

                        </div>

                        <div class="worker-rate">
                            ₹${Number(worker.rate).toLocaleString("en-IN")}/hr
                        </div>

                    </div>


                    <div class="worker-info">

                        <div class="worker-info-row">

                            <span>
                                <i class="fa-solid fa-phone"></i>
                                Phone
                            </span>

                            <strong>
                                ${escapeHTML(worker.phone || "Not added")}
                            </strong>

                        </div>


                        <div class="worker-info-row">

                            <span>
                                <i class="fa-solid fa-calendar-check"></i>
                                Records
                            </span>

                            <strong>
                                ${
                                    attendance.filter(
                                        a =>
                                            a.workerId === worker.id
                                    ).length
                                }
                            </strong>

                        </div>

                    </div>


                    <div class="worker-actions">

                        <button
                            class="small-btn"
                            onclick="editWorker('${worker.id}')"
                        >
                            <i class="fa-solid fa-pen"></i>
                            Edit
                        </button>


                        <button
                            class="small-btn delete"
                            onclick="deleteWorker('${worker.id}')"
                        >
                            <i class="fa-solid fa-trash"></i>
                            Delete
                        </button>

                    </div>

                </div>

            `;

        }).join("");

}


$("workerSearch")
    .addEventListener(
        "input",
        renderWorkers
    );


/* ================= EDIT WORKER ================= */

window.editWorker = function (id) {

    const worker =
        workers.find(
            worker => worker.id === id
        );

    if (!worker) return;

    openWorkerModal(worker);

};


/* ================= DELETE WORKER ================= */

window.deleteWorker = function (id) {

    const worker =
        workers.find(
            worker => worker.id === id
        );

    if (!worker) return;


    const confirmed =
        confirm(
            `Delete ${worker.name}?\n\nTheir attendance records will also be deleted.`
        );


    if (!confirmed) return;


    workers =
        workers.filter(
            worker => worker.id !== id
        );


    attendance =
        attendance.filter(
            record => record.workerId !== id
        );


    saveData();

    renderAll();

    showToast(
        "Worker deleted."
    );

};


/* ================= ATTENDANCE MODAL ================= */

function populateWorkerSelect() {

    const select =
        $("attendanceWorker");

    const currentValue =
        select.value;


    select.innerHTML = `

        <option value="">
            Select worker
        </option>

    `;


    workers.forEach(worker => {

        const option =
            document.createElement("option");

        option.value =
            worker.id;

        option.textContent =
            `${worker.name} — ₹${worker.rate}/hr`;

        select.appendChild(option);

    });


    if (currentValue) {

        select.value =
            currentValue;

    }

}


/* ================= OPEN ATTENDANCE ================= */

function openAttendanceModal(record = null) {

    if (!workers.length) {

        showToast(
            "Add a worker before marking attendance."
        );

        openWorkerModal();

        return;

    }


    $("attendanceModal")
        .classList.add("show");


    populateWorkerSelect();


    if (record) {

        $("editAttendanceId").value =
            record.id;

        $("attendanceWorker").value =
            record.workerId;

        $("recordDate").value =
            record.date;

        $("attendanceStatus").value =
            record.status;

        $("shift1Start").value =
            record.shift1Start || "";

        $("shift1End").value =
            record.shift1End || "";

        $("shift2Start").value =
            record.shift2Start || "";

        $("shift2End").value =
            record.shift2End || "";

        $("addShiftBtn").style.display =
            "none";

        $("shiftSection").style.display =
            "block";

    } else {

        $("attendanceForm").reset();

        $("editAttendanceId").value =
            "";

        $("recordDate").value =
            getToday();

        $("attendanceStatus").value =
            "Present";

        $("shiftSection").style.display =
            "block";

        $("addShiftBtn").style.display =
            "block";

    }


    updateCalculationPreview();

}


/* ================= ATTENDANCE BUTTON ================= */

$("addAttendanceBtn")
    .addEventListener(
        "click",
        () => openAttendanceModal()
    );


/* ================= SECOND SHIFT ================= */

$("addShiftBtn")
    .addEventListener(
        "click",
        () => {

            $("shift2Start").value = "";

            $("shift2End").value = "";

            $("addShiftBtn").style.display =
                "none";

            $("removeShift2").style.display =
                "block";

        }
    );


$("removeShift2")
    .addEventListener(
        "click",
        () => {

            $("shift2Start").value = "";

            $("shift2End").value = "";

            $("addShiftBtn").style.display =
                "block";

        }
    );


/* ================= STATUS CHANGE ================= */

$("attendanceStatus")
    .addEventListener(
        "change",
        function () {

            const isPresent =
                this.value === "Present";


            $("shiftSection").style.display =
                isPresent
                    ? "block"
                    : "none";


            $("addShiftBtn").style.display =
                isPresent
                    ? "block"
                    : "none";


            updateCalculationPreview();

        }
    );


/* ================= LIVE CALCULATION ================= */

function updateCalculationPreview() {

    const workerId =
        $("attendanceWorker").value;


    const worker =
        workers.find(
            w => w.id === workerId
        );


    const data = {

        shift1Start:
            $("shift1Start").value,

        shift1End:
            $("shift1End").value,

        shift2Start:
            $("shift2Start").value,

        shift2End:
            $("shift2End").value

    };


    const totalMinutes =
        calculateTotalMinutes(data);


    const decimalHours =
        minutesToDecimalHours(
            totalMinutes
        );


    const rate =
        worker
            ? Number(worker.rate)
            : 0;


    const payment =
        decimalHours * rate;


    $("previewHours").textContent =
        formatMinutes(totalMinutes);


    $("previewRate").textContent =
        `₹${rate}/hr`;


    $("previewPayment").textContent =
        formatCurrency(payment);

}


[
    "attendanceWorker",
    "shift1Start",
    "shift1End",
    "shift2Start",
    "shift2End"
].forEach(id => {

    $(id).addEventListener(
        "input",
        updateCalculationPreview
    );

    $(id).addEventListener(
        "change",
        updateCalculationPreview
    );

});


/* ================= SAVE ATTENDANCE ================= */

$("attendanceForm")
    .addEventListener(
        "submit",
        function (event) {

            event.preventDefault();


            const editingId =
                $("editAttendanceId").value;


            const workerId =
                $("attendanceWorker").value;


            const worker =
                workers.find(
                    w => w.id === workerId
                );


            if (!worker) {

                showToast(
                    "Please select a worker."
                );

                return;

            }


            const status =
                $("attendanceStatus").value;


            const date =
                $("recordDate").value;


            if (!date) {

                showToast(
                    "Please select a date."
                );

                return;

            }


            const shift1Start =
                $("shift1Start").value;

            const shift1End =
                $("shift1End").value;

            const shift2Start =
                $("shift2Start").value;

            const shift2End =
                $("shift2End").value;


            /*
                Prevent incomplete shifts.
            */

            if (
                status === "Present" &&
                (
                    (shift1Start && !shift1End) ||
                    (!shift1Start && shift1End) ||
                    (shift2Start && !shift2End) ||
                    (!shift2Start && shift2End)
                )
            ) {

                showToast(
                    "Please enter both start and end time."
                );

                return;

            }


            const totalMinutes =
                status === "Present"
                    ? calculateTotalMinutes({

                        shift1Start,
                        shift1End,
                        shift2Start,
                        shift2End

                    })
                    : 0;


            const totalHours =
                minutesToDecimalHours(
                    totalMinutes
                );


            const payment =
                totalHours *
                Number(worker.rate);


            /*
                Prevent duplicate worker/date
                records.
            */

            const duplicate =
                attendance.find(
                    record =>
                        record.workerId === workerId &&
                        record.date === date &&
                        record.id !== editingId
                );


            if (duplicate) {

                showToast(
                    "Attendance already exists for this worker on this date."
                );

                return;

            }


            const recordData = {

                workerId,

                date,

                status,

                shift1Start:
                    status === "Present"
                        ? shift1Start
                        : "",

                shift1End:
                    status === "Present"
                        ? shift1End
                        : "",

                shift2Start:
                    status === "Present"
                        ? shift2Start
                        : "",

                shift2End:
                    status === "Present"
                        ? shift2End
                        : "",

                totalMinutes,

                totalHours,

                payment,

                hourlyRate:
                    Number(worker.rate)

            };


            if (editingId) {

                const index =
                    attendance.findIndex(
                        a => a.id === editingId
                    );


                if (index !== -1) {

                    attendance[index] = {

                        ...attendance[index],

                        ...recordData

                    };

                }


                showToast(
                    "Attendance updated."
                );

            } else {

                attendance.push({

                    id: generateId("A"),

                    ...recordData,

                    createdAt:
                        new Date().toISOString()

                });


                showToast(
                    "Attendance saved successfully."
                );

            }


            saveData();

            closeModal("attendanceModal");

            renderAll();

        }
    );


/* ================= ATTENDANCE TABLE ================= */

function renderAttendance() {

    const table =
        $("attendanceTable");


    const selectedDate =
        $("attendanceDate").value ||
        getToday();


    const search =
        $("attendanceSearch").value
            .trim()
            .toLowerCase();


    let records =
        attendance.filter(
            record =>
                record.date === selectedDate
        );


    if (search) {

        records =
            records.filter(record => {

                const worker =
                    workers.find(
                        w =>
                            w.id === record.workerId
                    );

                return worker &&
                    worker.name
                        .toLowerCase()
                        .includes(search);

            });

    }


    if (!records.length) {

        table.innerHTML = emptyTable(
            8,
            "No attendance records",
            "Mark attendance for this date to see records."
        );

        return;

    }


    table.innerHTML =
        records
            .sort(
                (a, b) =>
                    a.date.localeCompare(b.date)
            )
            .map(record => {

                const worker =
                    workers.find(
                        w =>
                            w.id === record.workerId
                    );


                if (!worker) return "";


                return `

                    <tr>

                        <td>

                            ${workerHTML(worker)}

                        </td>


                        <td>

                            ${statusHTML(record.status)}

                        </td>


                        <td>
                            ${shiftHTML(
                                record.shift1Start,
                                record.shift1End
                            )}
                        </td>


                        <td>
                            ${shiftHTML(
                                record.shift2Start,
                                record.shift2End
                            )}
                        </td>


                        <td>

                            <strong>
                                ${formatMinutes(
                                    record.totalMinutes || 0
                                )}
                            </strong>

                        </td>


                        <td>
                            ₹${Number(
                                worker.rate
                            ).toLocaleString("en-IN")}/hr
                        </td>


                        <td>

                            <strong>
                                ${formatCurrency(
                                    record.payment
                                )}
                            </strong>

                        </td>


                        <td>

                            <button
                                class="small-btn"
                                onclick="editAttendance('${record.id}')"
                            >
                                Edit
                            </button>

                        </td>

                    </tr>

                `;

            }).join("");

}


/* ================= EDIT ATTENDANCE ================= */

window.editAttendance =
    function (id) {

        const record =
            attendance.find(
                a => a.id === id
            );

        if (!record) return;

        openAttendanceModal(record);

    };


/* ================= DELETE ATTENDANCE ================= */

window.deleteAttendance =
    function (id) {

        const confirmed =
            confirm(
                "Delete this attendance record?"
            );

        if (!confirmed) return;


        attendance =
            attendance.filter(
                record =>
                    record.id !== id
            );


        saveData();

        renderAll();

        showToast(
            "Attendance deleted."
        );

    };


/* ================= PAYMENT ================= */

function renderPayments() {

    let totalPayment = 0;

    let totalMinutes = 0;


    attendance.forEach(record => {

        totalPayment +=
            Number(record.payment || 0);

        totalMinutes +=
            Number(record.totalMinutes || 0);

    });


    $("paymentTotal").textContent =
        formatCurrency(totalPayment);


    $("paymentHours").textContent =
        formatMinutes(totalMinutes);


    const workerTotals = {};


    attendance.forEach(record => {

        if (!workerTotals[record.workerId]) {

            workerTotals[record.workerId] = {

                minutes: 0,

                payment: 0

            };

        }


        workerTotals[record.workerId].minutes +=
            Number(record.totalMinutes || 0);


        workerTotals[record.workerId].payment +=
            Number(record.payment || 0);

    });


    const table =
        $("paymentsTable");


    if (!workers.length) {

        table.innerHTML =
            emptyTable(
                4,
                "No workers",
                "Add workers to see payment information."
            );

        return;

    }


    table.innerHTML =
        workers.map(worker => {

            const data =
                workerTotals[worker.id] ||
                {
                    minutes: 0,
                    payment: 0
                };


            return `

                <tr>

                    <td>
                        ${workerHTML(worker)}
                    </td>

                    <td>
                        ₹${Number(
                            worker.rate
                        ).toLocaleString("en-IN")}/hr
                    </td>

                    <td>
                        ${formatMinutes(
                            data.minutes
                        )}
                    </td>

                    <td>

                        <strong>
                            ${formatCurrency(
                                data.payment
                            )}
                        </strong>

                    </td>

                </tr>

            `;

        }).join("");

}


/* ================= REPORTS ================= */

function populateReportWorkers() {

    const select =
        $("reportWorker");

    const current =
        select.value;


    select.innerHTML =
        `<option value="all">
            All Workers
        </option>`;


    workers.forEach(worker => {

        select.innerHTML += `

            <option value="${worker.id}">
                ${escapeHTML(worker.name)}
            </option>

        `;

    });


    if (
        workers.some(
            w => w.id === current
        )
    ) {

        select.value = current;

    }

}


function renderReports() {

    populateReportWorkers();


    if (!$("reportMonth").value) {

        $("reportMonth").value =
            getToday().substring(0, 7);

    }


    const month =
        $("reportMonth").value;


    const workerFilter =
        $("reportWorker").value;


    let records =
        attendance.filter(
            record =>
                record.date.startsWith(month)
        );


    if (workerFilter !== "all") {

        records =
            records.filter(
                record =>
                    record.workerId === workerFilter
            );

    }


    let days = 0;

    let minutes = 0;

    let payment = 0;


    records.forEach(record => {

        if (record.status === "Present") {

            days++;

        }

        minutes +=
            Number(record.totalMinutes || 0);

        payment +=
            Number(record.payment || 0);

    });


    $("reportDays").textContent =
        days;

    $("reportHours").textContent =
        formatMinutes(minutes);

    $("reportPayment").textContent =
        formatCurrency(payment);


    const table =
        $("reportsTable");


    if (!records.length) {

        table.innerHTML =
            emptyTable(
                6,
                "No records found",
                "Try another month or worker."
            );

        return;

    }


    table.innerHTML =
        records
            .sort(
                (a, b) =>
                    b.date.localeCompare(a.date)
            )
            .map(record => {

                const worker =
                    workers.find(
                        w =>
                            w.id === record.workerId
                    );


                if (!worker) return "";


                return `

                    <tr>

                        <td>
                            ${formatDate(record.date)}
                        </td>

                        <td>
                            ${workerHTML(worker)}
                        </td>

                        <td>
                            ${shiftHTML(
                                record.shift1Start,
                                record.shift1End
                            )}
                        </td>

                        <td>
                            ${shiftHTML(
                                record.shift2Start,
                                record.shift2End
                            )}
                        </td>

                        <td>
                            ${formatMinutes(
                                record.totalMinutes || 0
                            )}
                        </td>

                        <td>
                            <strong>
                                ${formatCurrency(
                                    record.payment
                                )}
                            </strong>
                        </td>

                    </tr>

                `;

            }).join("");

}


/* ================= DASHBOARD ================= */

function updateDashboard() {

    const today =
        getToday();


    const todayRecords =
        attendance.filter(
            record =>
                record.date === today
        );


    const present =
        todayRecords.filter(
            record =>
                record.status === "Present"
        ).length;


    const totalMinutes =
        todayRecords.reduce(
            (sum, record) =>
                sum +
                Number(record.totalMinutes || 0),
            0
        );


    const payment =
        todayRecords.reduce(
            (sum, record) =>
                sum +
                Number(record.payment || 0),
            0
        );


    $("statWorkers").textContent =
        workers.length;

    $("statPresent").textContent =
        present;

    $("statHours").textContent =
        formatMinutes(totalMinutes);

    $("statPayment").textContent =
        formatCurrency(payment);


    $("summaryPresent").textContent =
        present;

    $("summaryAbsent").textContent =
        Math.max(
            workers.length - present,
            0
        );

    $("summaryHours").textContent =
        formatMinutes(totalMinutes);

    $("summaryPayment").textContent =
        formatCurrency(payment);


    const now =
        new Date();


    $("dashboardDate").textContent =
        now.toLocaleDateString(
            "en-IN",
            {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric"
            }
        );


    $("summaryDate").textContent =
        formatDate(today);


    renderRecentAttendance();

}


/* ================= RECENT ATTENDANCE ================= */

function renderRecentAttendance() {

    const table =
        $("recentAttendanceTable");


    const records =
        [...attendance]
            .sort(
                (a, b) =>
                    b.date.localeCompare(a.date)
            )
            .slice(0, 7);


    if (!records.length) {

        table.innerHTML =
            emptyTable(
                7,
                "No attendance yet",
                "Start by marking attendance for a worker."
            );

        return;

    }


    table.innerHTML =
        records.map(record => {

            const worker =
                workers.find(
                    w =>
                        w.id === record.workerId
                );


            if (!worker) return "";


            return `

                <tr>

                    <td>
                        ${workerHTML(worker)}
                    </td>

                    <td>
                        ${formatDate(record.date)}
                    </td>

                    <td>
                        ${shiftHTML(
                            record.shift1Start,
                            record.shift1End
                        )}
                    </td>

                    <td>
                        ${shiftHTML(
                            record.shift2Start,
                            record.shift2End
                        )}
                    </td>

                    <td>
                        <strong>
                            ${formatMinutes(
                                record.totalMinutes || 0
                            )}
                        </strong>
                    </td>

                    <td>
                        ${formatCurrency(
                            record.payment
                        )}
                    </td>

                    <td>
                        ${statusHTML(
                            record.status
                        )}
                    </td>

                </tr>

            `;

        }).join("");

}


/* ================= HTML HELPERS ================= */

function workerHTML(worker) {

    const initials =
        worker.name
            .split(" ")
            .map(word => word[0])
            .join("")
            .substring(0, 2)
            .toUpperCase();


    return `

        <div class="worker-cell">

            <div class="worker-avatar">
                ${escapeHTML(initials)}
            </div>

            <div>

                <strong>
                    ${escapeHTML(worker.name)}
                </strong>

                <small>
                    ${escapeHTML(worker.workerId)}
                </small>

            </div>

        </div>

    `;

}


function statusHTML(status) {

    const className =
        status.toLowerCase();


    return `

        <span class="status ${className}">
            ${escapeHTML(status)}
        </span>

    `;

}


function shiftHTML(start, end) {

    if (!start || !end) {

        return `<span style="color:#a5adba">—</span>`;

    }


    return `${formatTime(start)} → ${formatTime(end)}`;

}


function formatTime(time) {

    if (!time) return "-";


    const [hour, minute] =
        time.split(":").map(Number);


    const date =
        new Date();

    date.setHours(
        hour,
        minute,
        0,
        0
    );


    return date.toLocaleTimeString(
        "en-IN",
        {
            hour: "numeric",
            minute: "2-digit"
        }
    );

}


function emptyTable(
    columns,
    title,
    message
) {

    return `

        <tr>

            <td
                colspan="${columns}"
                class="empty-state"
            >

                <i class="fa-solid fa-clipboard-list"></i>

                <strong>
                    ${escapeHTML(title)}
                </strong>

                <span>
                    ${escapeHTML(message)}
                </span>

            </td>

        </tr>

    `;

}


/*
    Prevent user-entered text from
    becoming HTML.
*/

function escapeHTML(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


/* ================= TOAST ================= */

function showToast(message) {

    const container =
        $("toastContainer");


    const toast =
        document.createElement("div");


    toast.className =
        "toast";


    toast.textContent =
        message;


    container.appendChild(toast);


    setTimeout(
        () => {

            toast.remove();

        },
        2800
    );

}


/* ================= FILTERS ================= */

$("attendanceDate").value =
    getToday();


$("attendanceDate")
    .addEventListener(
        "change",
        renderAttendance
    );


$("attendanceSearch")
    .addEventListener(
        "input",
        renderAttendance
    );


$("reportMonth")
    .addEventListener(
        "change",
        renderReports
    );


$("reportWorker")
    .addEventListener(
        "change",
        renderReports
    );


/* ================= INITIALIZE ================= */

function renderAll() {

    updateDashboard();

    renderWorkers();

    renderAttendance();

    renderPayments();

    renderReports();

}


renderAll();