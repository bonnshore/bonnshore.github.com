var autotag = {
	init: function(){
		var color = ['#9D9D9D', '#adadad', '#3C3C3C', '#5b5b5b', '#7b7b7b', '#272727'];
		var size = ['16px', '25px','19px','17px'];
		$(tagDiv).find('a').each(function(i,e){ 
			$(e).css('color', color[autotag.rand(color.length)]);
			$(e).css('font-size', size[autotag.rand(size.length)]);
		});
	},
	rand: function(arraylen){
		return Math.floor(Math.random()*arraylen);
	}
}
