import React, { useState, useEffect, useRef, useCallback } from 'react';
import '../styles/player.css';
import Icon from '../config/components/Icon.jsx';
import songLibrary from '../libs/Library.json';
import '../styles/components/volumeTrigger.css';
import '../styles/components/toolbox.css';
import convertTime from '../config/functions/convertTime.js';
import Message from '../config/functions/Message.js';
export default function Player() {

   // Base variables for functionality of player
   const audioRef = useRef(null);
   const [isFullscreen, setFullscreen] = useState(false);
   let isPlaying = useRef(false);
   const [currentSongIndex, setCurrentSongIndex] = useState(parseInt(localStorage.getItem('songIndex')) || 0);
   const currentSong = songLibrary[currentSongIndex];
   const [playModes] = useState(['resume', 'repeat', 'shuffle']);
   const [playMode, setPlayMode] = useState(0);

   // Timing values
   const [currentTime, setCurrentTime] = useState(0);
   const [songTime, setSongTime] = useState(0);

   // Volume based variables
   const volumeLevel = useRef(1);

   // Components variables
   const [isCoverOpen, setCoverOpen] = useState(false);
   const [isVolumeTrigger, setVolumeTriggerOpen] = useState(false);
   const [isToolBoxOpen, setIsToolBoxOpen] = useState(false);
   const [copiedInfo, setCopiedInfo] = useState(false);

   function secondsToMinutes(seconds) {
      return `${Math.floor(seconds / 60)}:${(Math.round(seconds % 60) < 10 ? '0' : '')}${Math.round(seconds % 60)}`;
   }

   // Update time values on display
   useEffect(() => {
      audioRef.current = new Audio(require(`../music/${currentSong.audio}`));
      audioRef.current.volume = volumeLevel.current;
      return () => {
         if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
         }
      };
   }, [currentSong]);

   useEffect(() => {
      const interval = setInterval(() => {
         setSongTime(audioRef.current.currentTime);
      }, 1000);
      return () => clearInterval(interval);
   }, []);

   useEffect(() => {
      audioRef.current.currentTime = currentTime;
      isPlaying.current ? audioRef.current.play()
         .then(() => { }).catch((error) => console.error(error)) : audioRef.current.pause();
   }, [currentTime]);

   // Play/pause function
   const togglePlayer = () => {
      if (isPlaying.current) {
         setCurrentTime(audioRef.current.currentTime);
      }
      isPlaying.current = !isPlaying.current; // Update the ref value
      if (audioRef.current) {
         // Use the current property to access the current value of the ref
         isPlaying.current ? audioRef.current.play().then(() => { }).catch((error) => console.error(error)) : audioRef.current.pause();
      }
   };

   // Update song time
   const handleSongTimeChange = (event) => {
      const newTime = parseFloat(event.target.value);
      setSongTime(newTime);
      if (audioRef.current) {
         audioRef.current.currentTime = newTime;
      }
   };

   //component toggle functions
   const toggleToolBox = () => setIsToolBoxOpen(!(isToolBoxOpen));
   const toggleVolumeTrigger = () => setVolumeTriggerOpen(!(isVolumeTrigger));
   const toggleFullscreenCover = () => setCoverOpen(!(isCoverOpen));

   const resetPlayerState = useCallback(() => {
      togglePlayer();
      setCurrentTime(0);
      setTimeout(() => { togglePlayer() }, 1000);
   }, []);

   const togglePlayMode = () => {
      if ((playMode + 1 >= playModes.length)) {
         setPlayMode(0);
      } else {
         setPlayMode(playMode + 1)
      }
   }

   //set volume by keys
   const setVolume = (newValue) => {
      newValue >= 1 ? newValue = 1 :
         newValue <= 0 ? newValue = 0 :
            volumeLevel.current = newValue;
      audioRef.current.volume = newValue;
   };

   const playRandomSong = useCallback(() => {
      setCurrentSongIndex(Math.floor(Math.random() * songLibrary.length));
   }, []);

   // Change the song
   const changeSongManually = useCallback((index) => {
      if (index >= 0 && index < songLibrary.length) {
         switch (playMode) {
            case 0: setCurrentSongIndex(index); break; //regular
            case 1: setCurrentTime(0); break;          //repeat
            case 2: playRandomSong();                  //shuffle
         }
         resetPlayerState();
      }
   }, [playRandomSong, playMode, resetPlayerState]);

   function copyCurrentSong() {
      if (!navigator.clipboard || !navigator.clipboard.writeText) {
         console.error('Clipboard API not supported on this device.');
         alert('your browser does not support the MWD Clipboard Api functions');
         return;
      }
      navigator.clipboard.writeText(JSON.stringify(currentSong))
         .then(() => {
            setCopiedInfo(true);
            setTimeout(() => { setCopiedInfo(false); }, 1000);
         })
         .catch((error) => {
            console.error('Error copying song object to clipboard', error);
         });
   }

   // Handle volume change
   const handleVolumeChange = (e) => {
      const newVolume = parseFloat(e.target.value);
      volumeLevel.current = newVolume;
      audioRef.current.volume = newVolume;
   };

   // Toggle full screen
   const toggleFullScreen = () => {
      if (!document.fullscreenElement && !document.mozFullScreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement) {
         setFullscreen(true);
         const elem = document.documentElement;
         const requestFullScreen =
            elem.requestFullscreen || elem.mozRequestFullScreen || elem.webkitRequestFullscreen || elem.msRequestFullscreen;
         requestFullScreen && requestFullScreen.call(elem, Element.ALLOW_KEYBOARD_INPUT);
      } else {
         setFullscreen(false);
         const exitFullScreen =
            document.exitFullscreen || document.mozCancelFullScreen || document.webkitExitFullscreen || document.msExitFullscreen;
         exitFullScreen && exitFullScreen.call(document);
      }
   };

   // Component to view song cover in full size
   const FullSizeCover = () => (
      <div onClick={toggleFullscreenCover} className='fullSizeCover'>
         <img loading='lazy' src={currentSong.cover} alt='Song Cover' />
      </div>
   );

   useEffect(() => {
      if (songTime.toFixed(0) >= convertTime(currentSong.length)) {
         changeSongManually(currentSongIndex + 1);
      }
   }, [songTime, currentSong.length, currentSongIndex, playMode, playRandomSong, resetPlayerState]);

   // Volume Trigger component
   const VolumeTrigger = () => (
      <div onClick={toggleVolumeTrigger} className='volumeTrigger'>
         <h1 className='volume-level'>{Math.round(volumeLevel.current * 100)}%</h1>
         <div className='volume-input'>
            <input type='range' min={0} max={1} step={0.01} onChange={handleVolumeChange} value={volumeLevel.current} />
         </div>
         <div className='volume-sections'>
            {[0, 0.25, 0.5, 0.75, 1].map((value) => (
               <span key={value} onClick={() => handleVolumeChange({ target: { value } })}>
                  <i>{value === 1 ? '1' : (value.toFixed(2) * 100)}</i>
               </span>
            ))}
         </div>
      </div>
   );

   //tools component
   const ToolBox = () => {
      return (
         <div className='toolBox' >
            <button>
               <Icon onClick={copyCurrentSong} icon={copiedInfo ? 'done' : 'data_object'} />
            </button>
            <button>
               <Icon onClick={togglePlayMode} icon={playModes[playMode]} />
            </button>
            <button>
               <Icon onClick={() => { toggleVolumeTrigger(); toggleToolBox(); }} icon='volume_up' />
            </button>
            <button>
               <Icon onClick={toggleFullScreen} icon={isFullscreen ? 'fullscreen_exit' : 'fullscreen'} />
            </button>
            <button>
               <Icon onClick={toggleToolBox} icon={'close'} />
            </button>
         </div>
      );
   }

   function changeSong(index) {
      if (index >= songLibrary.length || index <= 0) {
         return;
      } else {
         switch (playMode) {
            case 0:
            case 1: setCurrentSongIndex(index); break;
            case 2: playRandomSong(); break;
         }
         resetPlayerState();
      }
   }

   document.onkeydown = (e) => {
      if (e.keyCode === 32) { togglePlayer(); }
      switch (e.key) {
         case 'ArrowLeft': setCurrentSongIndex(currentSongIndex - 1); break;
         case 'ArrowRight': changeSongManually(currentSongIndex + 1); break;
         case 'ArrowUp': setVolume(audioRef.current.volume + 0.05); break;
         case 'ArrowDown': setVolume(audioRef.current.volume - 0.05); break;
         case 'f': toggleFullscreenCover(); break;
         case 'c': toggleToolBox(); break;
         default: return;
      }
   }

   useEffect(() => {
      // Check if the browser supports the Media Session API
      if ('mediaSession' in navigator) {
         navigator.mediaSession.metadata = new MediaMetadata({
            title: currentSong.title,
            artist: currentSong.artist,
            artwork: [
               { src: currentSong.cover, sizes: '301x301', type: 'image/png, image/jpeg' },
            ],
         });
         navigator.mediaSession.setActionHandler('play', () => { togglePlayer(); });
         navigator.mediaSession.setActionHandler('pause', () => { togglePlayer(); });
         navigator.mediaSession.setActionHandler('previoustrack', () => { changeSongManually(currentSongIndex - 1); });
         navigator.mediaSession.setActionHandler('nexttrack', () => { changeSongManually(currentSongIndex + 1); });
      }
   }, [currentSong, changeSongManually, currentSongIndex]);
   const showNotification = useCallback(() => {
      if ('Notification' in window) {
         Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
               const notification = new Notification('Now Playing', {
                  body: `${currentSong.artist} - ${currentSong.title}`,
                  icon: `${currentSong.cover}`,
               });
               notification.onshow = () => null;
            }
         });
      }
   }, [currentSong]);
   useEffect(() => {
      showNotification();
      setCurrentSongIndex(currentSongIndex);
   }, [currentSong, currentSongIndex, showNotification]);

   return (
      <React.Fragment>
         <Message message={playMode === 0 ? 'normal' : playMode === 1 ? 'repeat' : 'shuffle'} />
         {isCoverOpen ? <FullSizeCover /> : isVolumeTrigger ? <VolumeTrigger /> : isToolBoxOpen && <ToolBox />}
         <main style={{ backgroundImage: `url(${currentSong.cover})` }} className='backgroundBlurSection'>
            <div className='player'>
               <section>
                  <img
                     loading='lazy'
                     draggable='false'
                     onClick={toggleFullscreenCover}
                     className='songCover'
                     src={currentSong ? currentSong.cover : ''}
                     alt={`cover of ${currentSong.title}`}
                  />
               </section>
               <section>
                  <div className='songInformation'>
                     <div>
                        <h1>{currentSong.title}</h1>
                        <h3>{currentSong.artist}</h3>
                     </div>
                     <div>
                        <Icon onClick={toggleToolBox} icon={'menu'} />
                     </div>
                  </div>
                  <div className='musicLengthIndicator'>
                     <input
                        type='range'
                        min={0}
                        max={convertTime(currentSong.length)}
                        className='musicLengthIndicatorInputRange'
                        onChange={handleSongTimeChange}
                        value={songTime}
                     />
                     <div className='indicatorTimeLeft'>
                        <span>{secondsToMinutes(songTime)}</span>
                        <span>{currentSong.length}</span>
                     </div>
                  </div>
                  <div className='controlLayout'>
                     <button>
                        <Icon icon='first_page' onClick={() => changeSong(currentSongIndex - 1)} />
                     </button>
                     <button>
                        <Icon onClick={togglePlayer} icon={isPlaying.current ? 'pause' : 'play_arrow'} />
                     </button>
                     <button>
                        <Icon icon='last_page' onClick={() => changeSong(currentSongIndex + 1)} />
                     </button>
                  </div>
               </section>
            </div>
         </main>
      </React.Fragment>
   );
}