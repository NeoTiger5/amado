
// $(document).ready(function () {

$('#table_id').DataTable();   //jquery data table



$("#validate").validate({
  errorClass: "validerrors",

  rules: {
    username: {
      username: true,
      required: true,
      minlength: 4

    },

    email: {
      required: true,
      email: true
    },

    password: {
      required: true,
      minlength: 5
    },

    mobile: {
      required: true,
      minlength: 10
    }


  }
})


