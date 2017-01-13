/**
 * student_array - global array to hold student objects
 */

var student_array = [];

/**
 * addClicked - Event Handler when user clicks the add button
 */

function addClicked(){
  $(".btn-success").click(add_student);
}

/**
 * cancelClicked - Event Handler when user clicks the cancel button, should clear out student form
 */

function cancelClicked() {
  $(".btn-default").click(clearAddStudentForm);
}

/**
 * removeClicked - Event Handler when user clicks the delete button, should delete table row and remove object from array
 */

function removeClicked(){
  $('.student-list').on('click','.btn-danger',removeStudent);
}

/**
 * pullClicked - Event Handler when user clicks the get data button, updates table with database data
 * */

function dataClicked(){
  $(".btn-info").click(getData);
}

/**
 * getData - AJAX - pull data from database
 */

function getData() {
  startLoader();
  $.ajax({
    dataType: 'JSON',
    method: 'POST',
    data: {api_key: '6CVAIe2j0o'},
    url: '//s-apis.learningfuze.com/sgt/get',
    success: function (response) {
      student_array = [];
      $('.student_row').remove();
      student_array = response.data;
      for (var i = 0; i < student_array.length; i++) {
        addStudentToDom(student_array[i]);
        calculateAverage();
      }
    },
    complete: function(){
      stopLoader();
    }
  })
}

/**
 * addStudentToDataBase - AJAX - add data to database
 */
function addStudentToDataBase(student_object){
  startLoader();
  $.ajax({
    dataType: 'JSON',
    method: 'POST',
    data: {
            api_key: '6CVAIe2j0o',
            name: student_object.name,
            course: student_object.course,
            grade: student_object.grade
              },
    url:'//s-apis.learningfuze.com/sgt/create',
    success: function(response){
                if (response.success === true) {
                  //clear the form
                  student_object.id = response.new_id;
                  clearAddStudentForm();
                  student_array.push(student_object);
                  //add student object to the table
                  addStudentToDom(student_object);
                  //calculates the average of combined student grades
                  calculateAverage();
                  //Notifies user that they successfully added a student
                  addSuccess(student_object);
                }else if (response.success === false && response.errors[0].substr(0,24) === "'grade' must be a number"){
                  gradeNumError();
                }else if (response.success === false && response.errors[0].substr(0,24) === "'grade' is out of range "){
                  gradeRangeError();
                }
    },
    complete: function (){
      stopLoader();
    },
    error:function(response){
        if (response.error === true){
          console.log(response);
        }
    }
  })
}

/**
 * deleteStudentFromDataBase - AJAX - Remove data to database
 */

function deleteStudentFromDataBase(obj_id,row_index,row){
  startLoader();
  $.ajax({
    dataType: 'JSON',
    data:{
          api_key: '6CVAIe2j0o',
          student_id: obj_id
        },
    method: 'POST',
    url: '//s-apis.learningfuze.com/sgt/delete',
    success: function(response){
          if (response.success === true){
            //remove from the array
            student_array.splice(row_index,1);
            //remove from the DOM
            $(row).remove();
            //updates the Grade Average now that a student has been removed
            calculateAverage();
            //Success notification that a student was successfully deleted
            studentDeleted();
          }else if(response.success === false && response.errors[0].substring(0,40)==="Unable to delete, you are not authorized"){
            noAuthDel();
          }
    },
    complete:function(){
      stopLoader();
    },
    error: function(response){
      
    }
  })
}

/**
 * addStudent - creates a student objects based on input fields in the form and adds the object to global student array
 *
 * @return undefined
 */
var add_student = function() {
  //create student object and associates its properties with the form input
  var student_object = {};
  //From Student Name input
  student_object.name = $("#studentName").val();
  //From Student Course input
  student_object.course = $("#course").val();
  //From Student Grade input
  student_object.grade = $("#studentGrade").val();
  //indicates the index this object was placed in the student array
  
  //We will not push the object to the student array unless it has valid input
  if (student_object.name !== "" && student_object.course !== "" && student_object.grade !== ""){
    addStudentToDataBase(student_object);
  }
};

/**
 * addStudentToDom - take in a student object, create html elements from the values and then append the elements
 * into the .student_list tbody
 * @param studentObj
 */

function addStudentToDom(studentObj){
  //see attr - adds a data attribute called row index with array index this student object was added
  var table_row = $("<tr>",{class: "student_row"});
  var td_name = $("<td>").text(studentObj.name);
  var td_course = $("<td>").text(studentObj.course);
  var td_grade = $("<td>").text(studentObj.grade);
  var td_button = $("<td>");
  var delete_button = $("<button>",{class: "btn btn-danger btn-sm"}).text("Delete");
  $(".student-list tbody").append(table_row);
  $(table_row).append(td_name);
  $(table_row).append(td_course);
  $(table_row).append(td_grade);
  $(table_row).append(td_button);
  $(td_button).append(delete_button);
}

/**
 * Remove the student from the student table
 */

function removeStudent (){
  
  //Send to AJAX delete
  //this variable identifies the index of the row, returns a number based on the index
  var this_row_index  = $(this).parent().parent().index();
  //Send to AJAX delete
  //this variable returns the parent row of the element selected
  var this_row = $(this).parent().parent();
  //this variable retrieves the array info based on index
  var this_array_info = student_array[this_row_index];
  //Send to AJAX delete
  var object_id = student_array[this_row_index]['id'];
  deleteStudentFromDataBase(object_id,this_row_index,this_row);
}
/**
 * clearAddStudentForm - clears out the form values based on inputIds variable
 */

function clearAddStudentForm(){
  //form field values are reset with empty quotes
  $(".form-control").val("");
}

/**
 * calculateAverage - loop through the global student array and calculate average grade and return that value
 * @returns {number}
 */

function calculateAverage() {
  var grade_value = 0;
  var students = 0;
  var average_grade;
  
  //Gathers values for student grades and student totals
  for (i=0; i<student_array.length; i++) {
    grade_value += parseInt(student_array[i]['grade']);
    students++;
   }
   
   /*
   this conditional block ensures the Grade Average has a 0 value displayed when no student are
   present in the student grade table
    */
   if (students === 0){
     $(".avgGrade").text(0+"%");
   //Calculates grade average when students are present in the student grade table
   }else{
     average_grade = Math.floor(grade_value/students)+"%";
     $(".avgGrade").text(average_grade);
   }
}

/*/*
 * reset - resets the application to initial state. Global variables reset, DOM get reset to initial load state
 **/

/*
 * Show the loader when ajax request is made
 */

function startLoader (){
  $('#loader-1').show();
}

/*
 * Hide the loader when ajax request is completed
 */
function stopLoader (){
  $('#loader-1').hide();
}

/*
notification area - user has successfully added a student to the list
 */
function addSuccess(student_object){
  if ($('.alert').hasClass('alert-danger')){
    $('.alert').removeClass('alert-danger hidden').addClass('alert-success').text('You added student ' + student_object.name);
  }else{
    $('.alert').removeClass('hidden').addClass('alert-success').text('You added student ' + student_object.name);
  }
}

/*
 notification area - user needs to update grade to a number
 */
function gradeNumError(){
  if($('.alert').hasClass('alert-success')){
    $('.alert').removeClass('hidden alert-success').addClass('alert-danger').text('Please enter a number');
  }else {
    $('.alert').removeClass('hidden').addClass('alert-danger').text('Please enter a number');
  }
}

/*
 notification area - user needs to update grade to be within range
 */
function gradeRangeError(){
  if($('.alert').hasClass('alert-success')){
    $('.alert').removeClass('hidden alert-success').addClass('alert-danger').text('Enter a number between 0 and 100');
  }else {
    $('.alert').removeClass('hidden').addClass('alert-danger').text('Enter a number between 0 and 100');
  }
}

/*
 notification area - user has deleted student
 */
function studentDeleted(){
  if ($('.alert').hasClass('alert-danger')){
    $('.alert').removeClass('hidden alert-danger').addClass('alert-success').text('Student Successfully Deleted');
  }else{
    $('.alert').removeClass('hidden').addClass('alert-success').text('Student Successfully Deleted');
  }
}

/*
 notification area - user has is not authorized to delete the student
 */
function noAuthDel(){
  if ($('.alert').hasClass('alert-success')){
  $('.alert').removeClass('hidden alert-success').addClass('alert-danger').text('You are not authorized to delete');
}else{
    $('.alert').removeClass('hidden').addClass('alert-danger').text('You are not the creator of this student record, therefore not authorized to delete this record');
  }
}

/**
 * Listen for the document to load and reset the data to the initial state
*/
$(document).ready(function(){
  //update table on load
  getData();
  //loads click handler for the add button on DOM load
  addClicked();
  //loads click handler for the cancel button on DOM load
  cancelClicked();
  //loads click handler for the delete student button on DOM load
  removeClicked();
  //calculates average student grade
  calculateAverage();
  //Display all student data on DOM load
  dataClicked();
});

