var autotag = {
	init: function(){
		var color = ['#4D4D4D', '#6D6D6D', '#2C2C2C','#8D8D8D'];
		var size = ['16px', '19px','22px','25px','28px'];
		$("#tagDiv").find('a').each(function(i,e){ 
			$(e).css('color', color[autotag.rand(color.length)]);
			$(e).css('font-size', size[autotag.rand(size.length)]);
		});
	},
	rand: function(arraylen){
		return Math.floor(Math.random()*arraylen);
	}
}
