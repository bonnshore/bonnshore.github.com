var cz_load = {
    articles: "",
    init : function(){
        $.getJSON('post.json', function(data){
            cz_load.articles = data.articles;
        });
    },

    scroll : function()
    {
        $(window).scroll(function()
        {
            var $window=$(window);
            var $content = $('#content');
            var top = $content.offset().top;
            var offset = 5;
            var cz_offset = $("#cz_offset");
            var origin = (cz_offset.val() == ''?0:cz_offset.val());
            origin=parseInt(origin);
            var $extend = $( '<p class="post-nav"><span class="previous"><a href="/categories.html">' +
                ' « 分类看更方便'+
                '</a>'+
                ' </span>'+
                '</p>');
            var $no_more = $('<span class="no-more"><a href="javascript:;">停止自动加载</a></span>');
            var ext='';

            $no_more.find('a').click(function() {
                $window.unbind();
                $no_more.remove();
            });
            $(cz_load.articles).each(function(i,e)
            {
                if(i >= origin)
                {
                    ext += '<article class="post">'+
                        '<h2 class="post-title">'+
                        '<a href='+e.url+'>'+e.title+'</a></h2><p class="post-date">' +
                        '<span class="year">'+ e.year+'</span>'+
                        '<span class="month">'+ e.month+'</span>'+
                        '<span class="day">'+ e.day+'</span>'+
			'<span class="time">'+ e.time+'</span>'+
			'<span class="postcomment">'+ e.weather +'</span>'+
                        '<section class="article-content"> '
                        + e.description + '</section></article>'
                }

                if(i>= origin+offset-1)
                {
                    return false;
                }
            });
            if ($window.scrollTop() + $window.height() - top - $content.outerHeight() > ($window.height()*0.12))
            {
		setTimeout(function() {
                    $(".post-nav").detach();
                    $("#cz_display").append(ext).slideDown(1000);
                    if(cz_offset.val() < cz_load.articles.length)
                    {
                        $("#cz_display").append($extend);
                        $("#cz_display").find('.post-nav>.previous>a').parent().after($no_more);

                    }

                },1000);
                cz_offset.val(origin+offset);
                


            }




        });

    }

}

