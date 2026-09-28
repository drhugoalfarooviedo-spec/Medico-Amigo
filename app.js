document.addEventListener("DOMContentLoaded", () => {

  // =========================================
  // PANTALLAS
  // =========================================

  const loginScreen = document.getElementById("loginScreen");
  const homeScreen = document.getElementById("homeScreen");
  const patientScreen = document.getElementById("patientScreen");


  // =========================================
  // LOGIN
  // =========================================

  const loginForm = document.getElementById("loginForm");

  loginForm.addEventListener("submit", (event) => {

    event.preventDefault();

    loginScreen.classList.add("hidden");
    homeScreen.classList.remove("hidden");

    window.scrollTo(0, 0);

  });


  // =========================================
  // NUEVA CONSULTA
  // =========================================

  const newConsultationBtn =
    document.getElementById("newConsultationBtn");

  newConsultationBtn.addEventListener("click", () => {

    homeScreen.classList.add("hidden");
    patientScreen.classList.remove("hidden");

    resetPatientSearch();

    window.scrollTo(0, 0);

    setTimeout(() => {
      patientSearchInput.focus();
    }, 150);

  });


  // =========================================
  // VOLVER AL INICIO
  // =========================================

  const backHomeBtn =
    document.getElementById("backHomeBtn");

  backHomeBtn.addEventListener("click", () => {

    patientScreen.classList.add("hidden");
    homeScreen.classList.remove("hidden");

    resetPatientSearch();

    window.scrollTo(0, 0);

  });


  // =========================================
  // BUSCAR PACIENTE DESDE INICIO
  // =========================================

  const searchPatientBtn =
    document.getElementById("searchPatientBtn");

  searchPatientBtn.addEventListener("click", () => {

    homeScreen.classList.add("hidden");
    patientScreen.classList.remove("hidden");

    resetPatientSearch();

    window.scrollTo(0, 0);

    setTimeout(() => {
      patientSearchInput.focus();
    }, 150);

  });


  // =========================================
  // BUSCADOR DE PACIENTES
  // =========================================

  const patientSearchInput =
    document.getElementById("patientSearchInput");

  const patientResults =
    document.getElementById("patientResults");

  const noPatientResults =
    document.getElementById("noPatientResults");

  const patientCards =
    document.querySelectorAll(".patient-result");


  patientSearchInput.addEventListener("input", () => {

    const search =
      normalizeText(patientSearchInput.value.trim());

    let visiblePatients = 0;


    patientCards.forEach((patient) => {

      const name =
        normalizeText(patient.dataset.name || "");

      const ci =
        normalizeText(patient.dataset.ci || "");

      const phone =
        normalizeText(patient.dataset.phone || "");


      const matches =
        name.includes(search) ||
        ci.includes(search) ||
        phone.includes(search);


      if (matches) {

        patient.style.display = "flex";
        visiblePatients++;

      } else {

        patient.style.display = "none";

      }

    });


    if (visiblePatients === 0) {

      patientResults.classList.add("hidden");
      noPatientResults.classList.remove("hidden");

    } else {

      patientResults.classList.remove("hidden");
      noPatientResults.classList.add("hidden");

    }

  });


  // =========================================
  // NORMALIZAR TEXTO
  // Permite buscar María escribiendo Maria
  // =========================================

  function normalizeText(text) {

    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

  }


  // =========================================
  // REINICIAR BUSCADOR
  // =========================================

  function resetPatientSearch() {

    patientSearchInput.value = "";

    patientResults.classList.remove("hidden");
    noPatientResults.classList.add("hidden");

    patientCards.forEach((patient) => {
      patient.style.display = "flex";
    });

  }


  // =========================================
  // SELECCIONAR PACIENTE
  // =========================================

  patientCards.forEach((patient) => {

    patient.addEventListener("click", () => {

      const patientName =
        patient.querySelector(".patient-info strong").textContent;

      alert(
        "Paciente seleccionado:\n\n" +
        patientName +
        "\n\n" +
        "El siguiente paso será abrir su consulta médica."
      );

    });

  });


  // =========================================
  // REGISTRAR NUEVO PACIENTE
  // =========================================

  const registerPatientBtn =
    document.getElementById("registerPatientBtn");

  registerPatientBtn.addEventListener("click", () => {

    alert(
      "Registrar nuevo paciente\n\n" +
      "Aquí construiremos el formulario de registro."
    );

  });

});
