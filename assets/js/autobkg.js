var autobkg = {
	init: function(){
		var weekday = new Date();
                weekday=weekday.getDay()
		switch(weekday){
		    case 0:
			$(wrapper).css('background','url(/assets/themes/twitter/img/body7.jpg) fixed')
			break;
		    case 1:
			$(wrapper).css('background','url(/assets/themes/twitter/img/body1.jpg) fixed')
			break;
		    case 2:
			$(wrapper).css('background','url(/assets/themes/twitter/img/body2.jpg) fixed')
			break;
		    case 3:
			$(wrapper).css('background','url(/assets/themes/twitter/img/body3.jpg) fixed')	
			break;
		    case 4:
			$(wrapper).css('background','url(/assets/themes/twitter/img/body4.jpg) fixed')
			break;
		    case 5:
			$(wrapper).css('background','url(/assets/themes/twitter/img/body5.jpg) fixed')
			break;
		    case 6:
			$(wrapper).css('background','url(/assets/themes/twitter/img/body6.jpg) fixed')
			break;
		    default:
			$(wrapper).css('background','url(/assets/themes/twitter/img/body1.jpg) fixed')
		}
	      }
}
