document.addEventListener("DOMContentLoaded", () => {

  // =========================================
  // PANTALLAS
  // =========================================

  const loginScreen = document.getElementById("loginScreen");
  const homeScreen = document.getElementById("homeScreen");
  const patientScreen = document.getElementById("patientScreen");
  const newPatientScreen = document.getElementById("newPatientScreen");


  // =========================================
  // ELEMENTOS
  // =========================================

  const loginForm = document.getElementById("loginForm");

  const newConsultationBtn =
    document.getElementById("newConsultationBtn");

  const searchPatientBtn =
    document.getElementById("searchPatientBtn");

  const backHomeBtn =
    document.getElementById("backHomeBtn");

  const patientSearchInput =
    document.getElementById("patientSearchInput");

  const patientResults =
    document.getElementById("patientResults");

  const noPatientResults =
    document.getElementById("noPatientResults");

  const registerPatientBtn =
    document.getElementById("registerPatientBtn");


  // FORMULARIO NUEVO PACIENTE

  const newPatientForm =
    document.getElementById("newPatientForm");

  const backPatientSearchBtn =
    document.getElementById("backPatientSearchBtn");

  const cancelNewPatientBtn =
    document.getElementById("cancelNewPatientBtn");

  const patientFullName =
    document.getElementById("patientFullName");

  const patientDocument =
    document.getElementById("patientDocument");

  const patientBirthDate =
    document.getElementById("patientBirthDate");

  const patientSex =
    document.getElementById("patientSex");

  const patientPhone =
    document.getElementById("patientPhone");

  const patientAddress =
    document.getElementById("patientAddress");

  const emergencyContact =
    document.getElementById("emergencyContact");

  const patientHistory =
    document.getElementById("patientHistory");

  const patientAllergies =
    document.getElementById("patientAllergies");

  const patientMedication =
    document.getElementById("patientMedication");

  const patientObservations =
    document.getElementById("patientObservations");

  const calculatedAge =
    document.getElementById("calculatedAge");

  const ageValue =
    document.getElementById("ageValue");


  // =========================================
  // CAMBIAR DE PANTALLA
  // =========================================

  function showScreen(screen) {

    loginScreen.classList.add("hidden");
    homeScreen.classList.add("hidden");
    patientScreen.classList.add("hidden");
    newPatientScreen.classList.add("hidden");

    screen.classList.remove("hidden");

    window.scrollTo(0, 0);

  }


  // =========================================
  // LOGIN TEMPORAL
  // =========================================

  loginForm.addEventListener("submit", (event) => {

    event.preventDefault();

    showScreen(homeScreen);

  });


  // =========================================
  // ABRIR BÚSQUEDA DE PACIENTES
  // =========================================

  function openPatientSearch() {

    showScreen(patientScreen);

    resetPatientSearch();

    setTimeout(() => {
      patientSearchInput.focus();
    }, 150);

  }


  newConsultationBtn.addEventListener(
    "click",
    openPatientSearch
  );


  searchPatientBtn.addEventListener(
    "click",
    openPatientSearch
  );


  // =========================================
  // VOLVER AL INICIO
  // =========================================

  backHomeBtn.addEventListener("click", () => {

    resetPatientSearch();

    showScreen(homeScreen);

  });


  // =========================================
  // NORMALIZAR TEXTO
  // =========================================

  function normalizeText(text) {

    return String(text || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

  }


  // =========================================
  // OBTENER TARJETAS DE PACIENTES
  // =========================================

  function getPatientCards() {

    return document.querySelectorAll(
      ".patient-result"
    );

  }


  // =========================================
  // BUSCAR PACIENTES
  // =========================================

  patientSearchInput.addEventListener(
    "input",
    filterPatients
  );


  function filterPatients() {

    const search =
      normalizeText(
        patientSearchInput.value.trim()
      );

    const patientCards =
      getPatientCards();

    let visiblePatients = 0;


    patientCards.forEach((patient) => {

      const name =
        normalizeText(
          patient.dataset.name
        );

      const ci =
        normalizeText(
          patient.dataset.ci
        );

      const phone =
        normalizeText(
          patient.dataset.phone
        );


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

      noPatientResults.classList.remove(
        "hidden"
      );

    } else {

      patientResults.classList.remove(
        "hidden"
      );

      noPatientResults.classList.add(
        "hidden"
      );

    }

  }


  // =========================================
  // REINICIAR BÚSQUEDA
  // =========================================

  function resetPatientSearch() {

    patientSearchInput.value = "";

    patientResults.classList.remove(
      "hidden"
    );

    noPatientResults.classList.add(
      "hidden"
    );


    getPatientCards().forEach((patient) => {

      patient.style.display = "flex";

    });

  }


  // =========================================
  // SELECCIONAR PACIENTE
  // =========================================

  function selectPatient(patientCard) {

    const patientName =
      patientCard.querySelector(
        ".patient-info strong"
      ).textContent.trim();


    alert(
      "Paciente seleccionado:\n\n" +
      patientName +
      "\n\n" +
      "El siguiente paso será abrir la consulta médica."
    );

  }


  // Los pacientes que ya existen en HTML

  getPatientCards().forEach((patient) => {

    patient.addEventListener(
      "click",
      () => selectPatient(patient)
    );

  });


  // =========================================
  // ABRIR NUEVO PACIENTE
  // =========================================

  registerPatientBtn.addEventListener(
    "click",
    () => {

      newPatientForm.reset();

      calculatedAge.classList.add(
        "hidden"
      );

      ageValue.textContent = "-";

      showScreen(newPatientScreen);

      setTimeout(() => {
        patientFullName.focus();
      }, 150);

    }
  );


  // =========================================
  // VOLVER A BÚSQUEDA
  // =========================================

  function returnToPatientSearch() {

    showScreen(patientScreen);

  }


  backPatientSearchBtn.addEventListener(
    "click",
    returnToPatientSearch
  );


  cancelNewPatientBtn.addEventListener(
    "click",
    returnToPatientSearch
  );


  // =========================================
  // CALCULAR EDAD
  // =========================================

  patientBirthDate.addEventListener(
    "change",
    calculateAge
  );


  function calculateAge() {

    if (!patientBirthDate.value) {

      calculatedAge.classList.add(
        "hidden"
      );

      ageValue.textContent = "-";

      return null;

    }


    const birthDate =
      new Date(
        patientBirthDate.value + "T00:00:00"
      );

    const today =
      new Date();


    if (
      Number.isNaN(birthDate.getTime()) ||
      birthDate > today
    ) {

      calculatedAge.classList.add(
        "hidden"
      );

      ageValue.textContent = "-";

      return null;

    }


    let age =
      today.getFullYear() -
      birthDate.getFullYear();


    const monthDifference =
      today.getMonth() -
      birthDate.getMonth();


    if (
      monthDifference < 0 ||
      (
        monthDifference === 0 &&
        today.getDate() <
        birthDate.getDate()
      )
    ) {

      age--;

    }


    ageValue.textContent =
      age + (age === 1 ? " año" : " años");


    calculatedAge.classList.remove(
      "hidden"
    );


    return age;

  }


  // =========================================
  // OBTENER INICIALES
  // =========================================

  function getInitials(name) {

    const words =
      name
        .trim()
        .split(/\s+/)
        .filter(Boolean);


    if (words.length === 0) {

      return "P";

    }


    if (words.length === 1) {

      return words[0]
        .charAt(0)
        .toUpperCase();

    }


    return (
      words[0].charAt(0) +
      words[1].charAt(0)
    ).toUpperCase();

  }


  // =========================================
  // CREAR PACIENTE EN LA LISTA
  // =========================================

  function createPatientCard(patient) {

    const article =
      document.createElement("article");


    article.className =
      "patient-result";


    article.dataset.name =
      patient.name;

    article.dataset.ci =
      patient.document;

    article.dataset.phone =
      patient.phone;


    const avatar =
      document.createElement("div");

    avatar.className =
      "patient-avatar";

    avatar.textContent =
      getInitials(patient.name);


    const info =
      document.createElement("div");

    info.className =
      "patient-info";


    const name =
      document.createElement("strong");

    name.textContent =
      patient.name;


    const documentText =
      document.createElement("span");

    documentText.textContent =
      patient.document
        ? "CI: " + patient.document
        : "Sin documento";


    const details =
      document.createElement("small");


    const detailParts = [];


    if (patient.age !== null) {

      detailParts.push(
        patient.age +
        (patient.age === 1
          ? " año"
          : " años")
      );

    }


    if (patient.sex) {

      detailParts.push(
        patient.sex
      );

    }


    details.textContent =
      detailParts.length > 0
        ? detailParts.join(" · ")
        : "Datos básicos registrados";


    const arrow =
      document.createElement("span");

    arrow.className =
      "result-arrow";

    arrow.textContent =
      "›";


    info.appendChild(name);
    info.appendChild(documentText);
    info.appendChild(details);


    article.appendChild(avatar);
    article.appendChild(info);
    article.appendChild(arrow);


    article.addEventListener(
      "click",
      () => selectPatient(article)
    );


    patientResults.prepend(article);


    return article;

  }


  // =========================================
  // GUARDAR NUEVO PACIENTE
  // =========================================

  newPatientForm.addEventListener(
    "submit",
    (event) => {

      event.preventDefault();


      const fullName =
        patientFullName.value.trim();


      if (!fullName) {

        patientFullName.focus();

        return;

      }


      const age =
        calculateAge();


      const patient = {

        name:
          fullName,

        document:
          patientDocument.value.trim(),

        birthDate:
          patientBirthDate.value,

        age:
          age,

        sex:
          patientSex.value,

        phone:
          patientPhone.value.trim(),

        address:
          patientAddress.value.trim(),

        emergencyContact:
          emergencyContact.value.trim(),

        history:
          patientHistory.value.trim(),

        allergies:
          patientAllergies.value.trim(),

        medication:
          patientMedication.value.trim(),

        observations:
          patientObservations.value.trim()

      };


      const newCard =
        createPatientCard(patient);


      resetPatientSearch();

      showScreen(patientScreen);


      setTimeout(() => {

        newCard.scrollIntoView({
          behavior: "smooth",
          block: "center"
        });

      }, 100);


      setTimeout(() => {

        selectPatient(newCard);

      }, 350);

    }
  );

});
