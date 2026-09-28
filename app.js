document.addEventListener("DOMContentLoaded", () => {

  const loginForm = document.getElementById("loginForm");
  const loginScreen = document.getElementById("loginScreen");
  const homeScreen = document.getElementById("homeScreen");

  const newConsultationBtn =
    document.getElementById("newConsultationBtn");

  const searchPatientBtn =
    document.getElementById("searchPatientBtn");


  // LOGIN TEMPORAL
  // Más adelante será reemplazado por Supabase Auth.

  loginForm.addEventListener("submit", (event) => {

    event.preventDefault();

    loginScreen.classList.add("hidden");
    homeScreen.classList.remove("hidden");

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });

  });


  // NUEVA CONSULTA
  // Próximo módulo que construiremos.

  newConsultationBtn.addEventListener("click", () => {

    alert(
      "Nueva consulta\n\n" +
      "Aquí abriremos la búsqueda o registro del paciente."
    );

  });


  // BUSCAR PACIENTE

  searchPatientBtn.addEventListener("click", () => {

    alert(
      "Pacientes\n\n" +
      "Aquí podremos buscar por nombre, CI o teléfono."
    );

  });

});
