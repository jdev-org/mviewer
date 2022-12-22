var christmas = (function () {
    playSong = () => {
        let startPlayPromise = audioElem.play();
    }
    return {
        init: () => {
            playSong();
        }
    };
  })();
  
  new CustomComponent("christmas", christmas.init);
  