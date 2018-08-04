//tests on backend routes


var baseUrl= "http://localhost:3000";

$('#testbtn').on('click', function(e){
  fetch(baseUrl + '/api/login', {
    method: 'get'
  })
  .then( function(res){
    console.log(res);
  })
  .catch( (err) => {
    console.log(err);
  })
})
