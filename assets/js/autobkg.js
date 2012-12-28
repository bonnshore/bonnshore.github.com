var autobkg = {
	init: function(){
		var weekday = new Date();
                weekday=weekday.getDay()
		switch(weekday){
		    case 0:
			document.body.style.background='url(/assets/themes/twitter/img/body0.jpg) fixed';
			break;
		    case 1:
			document.body.style.background='url(/assets/themes/twitter/img/body1.jpg) fixed';
			break;
		    case 2:
			document.body.style.background='url(/assets/themes/twitter/img/body2.jpg) fixed';
			break;
		    case 3:
			document.body.style.background='url(/assets/themes/twitter/img/body3.jpg) fixed';
			break;
		    case 4:
			document.body.style.background='url(/assets/themes/twitter/img/body4.jpg) fixed';
			break;
		    case 5:
			document.body.style.background='url(/assets/themes/twitter/img/body5.jpg) fixed';
			break;
		    case 6:
			document.body.style.background='url(/assets/themes/twitter/img/body6.jpg) fixed';
			break;
		    default:
			document.body.style.background='url(/assets/themes/twitter/img/body1.jpg) fixed';
		}
	      }
}
