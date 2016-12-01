function hsadm101(userid, htmlId) { 

	"use strict";
	
	var templates = {};
	
	var model = {
		/**
		* courseInterest: ["ACTSC", "AFM", "AHS", "AMATH", "ANTH", "ARBUS", "ART", "ASIAN", "BIOL", "CCIV", "CDNST", "CHEM", "CHINA", "CLAS", "CM", "CMW", "CO", "COMM", "CROAT",
			"CS"],
		*/
		
		Interest2Code : {
			"courseBS_subject": ["BIOL", "PSYCH", "KIN", "REC", "HLTH"],
			"courseBC_subject": ["AFM", "COMM", "HRM", "MSCI", "SPCOM"],
			"courseCS_subject": ["CS"],
			"courseEG_subject": ["ENG"],
			"courseFA_subject": ["FINE", "MUSIC", "DRAMA"],
			"courseHM_subject": ["ANTH", "CLAS", "HIST", "MEDVL", "PHIL", "RS"],
			"courseLG_subject": ["CROAT","CHINA" ,"ESL", "FR", "GER", "GREEK", "ITAL", "JAPAN", "KOREA", "LATIN", "POLSH", "PORT", "RUSS", "SPAN"],
			"courseMA_subject": ["MATH","STAT", "ACTSC", "PMATH", "CO", "AMATH"],
			"coursePS_subject": ["EARTH","PHYS","CHEM","ENVS","ERS","GEOG","SCI"],
			"courseSS_subject": ["LS","PSCI","PLAN","SOC","SMF"]
		},

		valid_courses: [],
		course: {},
		course1: {},
		views: [],
		selected_timestamp: 0,

	addView: function (view) {
      this.views.push(view);
      view("");
    },

    /**
     * Update all of the views that are observing us.
     */
    updateViews: function (msg) {
      var i = 0;
      for (i = 0; i < this.views.length; i++) {
        this.views[i](msg);
      }
    },

    /**
    	* Gets the list of courses from model
    **/
    Get_Interest2CodeList: function() {
    	return $.map(this.Interest2Code, function(property, key){
    		return key;
    	});
    },

    Get_CodesbyInterest: function(interest) {
    	return this.Interest2Code[interest];
    },

    Set_valid_courses: function()
    {
    	this.valid_courses = [];
    },

    Set_selected_timestamp: function(timestamp){
    	console.log("Timestamp test " + timestamp);
    	this.selected_timestamp=timestamp;
    },

    Matches_day_of_week: function(daysoffered){
    	var days_array = ["Su", "M", "T", "W", "Th", "F", "Sa"];
    	var d = new Date();
    	var today = d.getDay();
    	var Thurs_removed=""; //Removing Thursday from daysoffered to see if it contains Tuesday
    	if(today === 2)
    	{
    		Thurs_removed = daysoffered.replace("Th","");
    		return Thurs_removed.indexOf(days_array[today])!=(-1);
    	}
    	else
    	{
    		return daysoffered.indexOf(days_array[today])!=(-1);
    	}
    },

    Class_is_going: function(starttime, endtime){
    	var going_flag=false;
    	var upper_range_mins=0;
    	var upper_range=0;
    	if(((this.selected_timestamp%100)+45)>60)
    	{
    		upper_range_mins=((this.selected_timestamp%100)+45)%60;
    		upper_range=this.selected_timestamp+100-(this.selected_timestamp%100)+upper_range_mins;
    	}
    	else
    	{
    		upper_range=this.selected_timestamp+45;
    	}
    	if(starttime<this.selected_timestamp && endtime>this.selected_timestamp)
    	{
    		going_flag=true;
    	}
    	if(starttime==this.selected_timestamp || (starttime>this.selected_timestamp && starttime<=upper_range))
    	{
    		going_flag=true;
    	}
    	return going_flag;
    },

    loadCourseInfo: function(subject) {
    	var that = this;
    	$.getJSON("https://api.uwaterloo.ca/v2/terms/1145/" + subject + "/" + "schedule.json?key=d2147f3652477e7b4a4e307675e6e4be",
        function (d) {
          if (d.meta.status === 200) {
            that.course = d.data;
            $.each(that.course, function(index, The_Course){
            	console.log("Got to the first course of each subject: " + The_Course.subject + " " + The_Course.catalog_number);
            	if(The_Course.classes[0].date.start_time === null)
            	{
            		return;
            	}
            	var i = 0;
     			for (i = 0; i < The_Course.classes.length; i++) 
     			{
	            	var start_time_hour = The_Course.classes[i].date.start_time.substring(0,2);
	            	var start_time_minute = The_Course.classes[i].date.start_time.substring(3,5);
	            	var start_time_parse = parseInt(start_time_hour + "" + start_time_minute);
	            	var end_time_hour = The_Course.classes[i].date.end_time.substring(0,2);
	            	var end_time_minute = The_Course.classes[i].date.end_time.substring(3,5);
	            	var end_time_parse = parseInt(end_time_hour + "" + end_time_minute);
	            	//console.log(The_Course.subject + " " + The_Course.catalog_number + "'s start time is: " + start_time_parse);
	            	//console.log(The_Course.subject + " " + The_Course.catalog_number + "'s end time is: " + end_time_parse);
	            	var offered_today = that.Matches_day_of_week(The_Course.classes[i].date.weekdays);
	            	var its_going = that.Class_is_going(start_time_parse, end_time_parse);
		           	//It is a lecture and it's currently running today.
					if(The_Course.section.substring(0,3) === "LEC" &&  offered_today && its_going) 
	            	{
	            		//console.log(The_Course.subject + " " + The_Course.catalog_number + "IS A VALID COURSE!");
	            		var copy_course_section = The_Course;
	            		copy_course_section.classes = [copy_course_section.classes[i]];
	            		that.valid_courses.push(copy_course_section);
	            	}
	            }
            });
            that.updateViews("course");
          } else {
            that.course = {};
            that.updateViews("error");
            console.log("Failed to read course data." + JSON.stringify(d.meta));
          }
        });
    }
};

    var courseView = {
    updateView: function (msg) {
      var t = "";
      if (msg === "error") {
        t = templates.error;
      } else if (msg === "course") {
        t = Mustache.render(templates.courseD, model);
      }
      $("#course_of_Interest").html(t);
    },

    initView: function () {
      console.log("Initializing courseView");

      /*
       * Set the controller for the "Go" button.
       * Get the subject and catalog from the input fields and
       * then tell the model to get the corresponding course.
       */
      $("#Get_Lecture").click(function () {
      	var TimeStamp_Now =  new Date();
      	var TimeStamp_Choose = "";
      	if($("#The_Choose").is(':checked'))
      	{
      		TimeStamp_Choose = $("#hour").val() + "" + $("#minute").val();

      	}else{
      		TimeStamp_Choose = TimeStamp_Now.getHours() + "" + TimeStamp_Now.getMinutes();
      	}
      	model.Set_selected_timestamp(parseInt(TimeStamp_Choose));
      	model.Set_valid_courses();
      	var LO_Interest = model.Get_Interest2CodeList();
      	$.each(LO_Interest, function(index, The_Interest){
      		console.log("The Following Interests are in the interest2code object: " + The_Interest);
      		var subject = $("#" + The_Interest).is(':checked');
      		var subject_of_interest = "";
      		var codes_subject_interest = "";
	      	if (subject)
	        {
	        	subject_of_interest = The_Interest;
	        	codes_subject_interest = model.Get_CodesbyInterest(subject_of_interest);
	        	$.each(codes_subject_interest, function(i, subject_abbrv){
	        	model.loadCourseInfo(subject_abbrv);
	        	});
	        }    
      	});
       console.log("Get! clicked!");
      });

      $("#The_Choose").click(function() {
      	$("#hour").prop('disabled', false);
      	$("#minute").prop('disabled', false);
      });

      $("#The_Now").click(function() {
      	$("#hour").prop('disabled', true);
      	$("#minute").prop('disabled', true);
      });

      model.addView(courseView.updateView);
    }
  };

   console.log("Initializing LectureCrawl(" + userid + ", " + htmlId + ")");
   portal.loadTemplates("widgets/hsadm101/templates.json",
    function (t) {
      templates = t;
      $(htmlId).html(templates.baseHtml);
      courseView.initView();
    });
} 
