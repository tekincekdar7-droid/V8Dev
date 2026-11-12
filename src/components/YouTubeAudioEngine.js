// YouTubeAudioEngine.js - Clean Unmuted Direct YouTube Playback Engine
import React, { useRef, useImperativeHandle, forwardRef, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

const INJECTED_JS = `
(function() {
  var lastSentTime = 0;

  function attach() {
    var v = document.querySelector('video');
    if (!v) {
      setTimeout(attach, 150);
      return;
    }

    function send(type, data) {
      try {
        if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: type, data: data }));
        }
      } catch (e) {}
    }

    send('ready', { duration: v.duration || 0 });

    v.addEventListener('play', function() { send('stateChange', 'playing'); });
    v.addEventListener('playing', function() { send('stateChange', 'playing'); });
    v.addEventListener('pause', function() { send('stateChange', 'paused'); });
    v.addEventListener('ended', function() { send('stateChange', 'ended'); });

    v.addEventListener('timeupdate', function() {
      var now = Date.now();
      if (now - lastSentTime > 350) {
        lastSentTime = now;
        send('timeUpdate', { currentTime: v.currentTime, duration: v.duration || 0 });
      }
    });

    // Unmute and force play
    v.muted = false;
    v.volume = 1.0;
    if (v.paused) {
      v.play().catch(function() {});
    }
  }

  attach();
})();
true;
`;

const YouTubeAudioEngine = forwardRef(function YouTubeAudioEngine(
  { onStateChange, onTimeUpdate, onError, currentVideoId, isPlaying },
  ref
) {
  const webViewRef = useRef(null);

  useImperativeHandle(ref, () => ({
    seekTo: (seconds) => {
      try {
        webViewRef.current?.injectJavaScript(`
          (function() {
            var v = document.querySelector('video');
            if (v) { v.currentTime = ${seconds}; }
          })();
          true;
        `);
      } catch (e) {}
    },
    play: () => {
      try {
        webViewRef.current?.injectJavaScript(`
          (function() {
            var v = document.querySelector('video');
            if (v) {
              v.muted = false;
              v.volume = 1.0;
              v.play().catch(function(){});
            }
          })();
          true;
        `);
      } catch (e) {}
    },
    pause: () => {
      try {
        webViewRef.current?.injectJavaScript(`
          (function() {
            var v = document.querySelector('video');
            if (v) { v.pause(); }
          })();
          true;
        `);
      } catch (e) {}
    },
  }));

  // Handle play/pause toggle from React Native
  useEffect(() => {
    if (isPlaying) {
      webViewRef.current?.injectJavaScript(`
        (function() {
          var v = document.querySelector('video');
          if (v && v.paused) {
            v.muted = false;
            v.volume = 1.0;
            v.play().catch(function(){});
          }
        })();
        true;
      `);
    } else {
      webViewRef.current?.injectJavaScript(`
        (function() {
          var v = document.querySelector('video');
          if (v && !v.paused) { v.pause(); }
        })();
        true;
      `);
    }
  }, [isPlaying]);

  const handleMessage = (event) => {
    try {
      const { type, data } = JSON.parse(event.nativeEvent.data);
      if (type === 'ready') {
        console.log('[YouTubeEngine] Video ready for:', currentVideoId);
        if (isPlaying) {
          webViewRef.current?.injectJavaScript(`
            (function() {
              var v = document.querySelector('video');
              if (v && v.paused) {
                v.muted = false;
                v.volume = 1.0;
                v.play().catch(function(){});
              }
            })();
            true;
          `);
        }
      } else if (type === 'stateChange') {
        console.log('[YouTubeEngine] State:', data);
        if (onStateChange) onStateChange(data);
      } else if (type === 'timeUpdate') {
        if (onTimeUpdate) onTimeUpdate(data);
      }
    } catch (e) {}
  };

  if (!currentVideoId) {
    return null;
  }

  // Full unmuted stream URL with HTML5 video autoplay
  const embedUrl = `https://www.youtube.com/embed/${currentVideoId}?autoplay=1&playsinline=1&controls=0&rel=0&modestbranding=1`;

  return (
    <View style={styles.hiddenContainer} pointerEvents="none">
      <WebView
        key={currentVideoId}
        ref={webViewRef}
        source={{ uri: embedUrl }}
        injectedJavaScript={INJECTED_JS}
        onMessage={handleMessage}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        allowsAirPlayForMediaPlayback={true}
        scrollEnabled={false}
        bounces={false}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        style={styles.webView}
      />
    </View>
  );
});

export default YouTubeAudioEngine;

const styles = StyleSheet.create({
  hiddenContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 100,
    height: 100,
    opacity: 1,
    zIndex: -9999,
  },
  webView: {
    width: 100,
    height: 100,
    backgroundColor: 'transparent',
  },
});
