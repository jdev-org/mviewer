var comments = (function () {

    var _initComments = () => {
        console.log("New comments addon");
    };

    return {
        init: _initComments,
    }
})();

new CustomComponent("comments", comments.init);