var christmas = (function () {
    playSong = () => {
        let audio = new Audio("/demo/christmas/Christmas_is_coming.mp3");
        audio.play();
        setInterval(() => playSong(), 50000)
    }
    return {
        init: () => {
            playSong();
        },
    };
  })();
  
  new CustomComponent("christmas", christmas.init);
  