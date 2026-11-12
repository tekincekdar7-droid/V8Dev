// YouTubeAudioEngine.js - High-Performance Direct YouTube Engine
import React, { useRef, useImperativeHandle, forwardRef, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

const INJECTED_JS = `
(function() {
  var lastSentTime = 0;
  var hasUnmuted = false;

  function attach() {
    var v = document.querySelector('video');
    if (!v) {
      setTimeout(attach, 200);
      return;
    }

    function send(type, data) {
      try {
        if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: type, data: data }));
        }
      } catch (e) {}
    }

    function tryUnmute() {
      if (!hasUnmuted && v) {
        v.muted = false;
        v.volume = 1.0;
        hasUnmuted = true;
      }
    }

    send('ready', { duration: v.duration || 0 });

    v.addEventListener('play', function() {
      tryUnmute();
      send('stateChange', 'playing');
    });

    v.addEventListener('playing', function() {
      tryUnmute();
      send('stateChange', 'playing');
    });

    v.addEventListener('pause', function() {
      send('stateChange', 'paused');
    });

    v.addEventListener('ended', function() {
      send('stateChange', 'ended');
    });

    v.addEventListener('waiting', function() {
      send('stateChange', 'buffering');
    });

    v.addEventListener('timeupdate', function() {
      var now = Date.now();
      if (now - lastSentTime > 400) {
        lastSentTime = now;
        send('timeUpdate', { currentTime: v.currentTime, duration: v.duration || 0 });
      }
    });

    // Start playing with iOS-safe muted fallback
    v.play().then(function() {
      tryUnmute();
    }).catch(function() {
      v.muted = true;
      v.play().then(function() {
        setTimeout(tryUnmute, 300);
      }).catch(function() {});
    });
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
              v.play().catch(function() {
                v.muted = true;
                v.play().then(function() { v.muted = false; });
              });
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
            v.play().catch(function() {
              v.muted = true;
              v.play().then(function() { v.muted = false; });
            });
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

  // mute=1 ensures iOS WebKit permits immediate autoplay, while INJECTED_JS un-mutes automatically
  const embedUrl = `https://www.youtube-nocookie.com/embed/${currentVideoId}?autoplay=1&playsinline=1&controls=0&mute=1&rel=0&modestbranding=1&enablejsapi=1`;

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
    width: 120,
    height: 120,
    opacity: 1,
    zIndex: -9999,
  },
  webView: {
    width: 120,
    height: 120,
    backgroundColor: 'transparent',
  },
});
