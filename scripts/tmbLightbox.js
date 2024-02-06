/**
* tmbLightbox.js
* Copyright (c) 2019-2024 Thomas M. Brodhead <https://bmt-systems.com>
* Released under the GNU GPLv3 License
* Date: 2024-02-06
*/

(function () {

    var addEventListeners;
    var clonedImage;
    var closeLightbox;
    var debounce;
    var setFirstDrag;
    var currentZoom;
    var enableOrDisableZoomButtons;
    var geometries;
    var getFirstDrag;
    var getGeometry;
    var getClonedImageGeometry;
    var getLightboxButtonsGeometry;
    var getLightboxContentGeometry;
    var getMatchingDimension;
    var getOriginalImageGeometry;
    var getZoomReciprocal;
    var initialize;
    var initializeDraggableEvents;
    var lastMoveZoomLevel;
    var lightbox;
    var lightboxCloseBtn;
    var lightboxContent;
    var lightboxNegativeSpace;
    var lightboxWrapperAnimationEnd;
    var lightboxZoomInBtn;
    var lightboxZoomOutBtn;
    var lightboxZoomResetBtn;
    var modifyZoom;
    var o;
    var setDraggable;
    var setZoomInButton;
    var setZoomOutButton;
    var showLightbox;
    var showLightboxAnimationEnd;
    var variableUpdateOnViewportResize;
    var variableUpdateOnWindowResize;
    var zoomCount;
    var zoomIn;
    var zoomInButton;
    var zoomOut;
    var zoomOutButton;
    var zoomMax;
    var zoomMin;
    var zoomReset;

///////////////
// Variables //
///////////////

// 'this' is the outer 'o' via .bind(o), so the outer 'o' === inner 'o':
    o = this;

    lightbox = document.querySelector('.tmb-lightbox-wrapper');
    lightboxNegativeSpace = lightbox.querySelector('.tmb-lightbox-negative-space');
    lightboxCloseBtn = lightbox.querySelector('.tmb-lightbox-close-btn');
    lightboxZoomInBtn = lightbox.querySelector('.tmb-lightbox-zoom-in-btn');
    lightboxZoomOutBtn = lightbox.querySelector('.tmb-lightbox-zoom-out-btn');
    lightboxZoomResetBtn = lightbox.querySelector('.tmb-lightbox-zoom-reset-btn');
    lightboxContent = lightbox.querySelector('.tmb-lightbox-content');
    zoomCount = 0;
    zoomMax = 8;
    zoomMin = 1;

///////////////
// Functions //
///////////////

// Close Image Viewer Overlay
    closeLightbox = function (e) {

        e.preventDefault();
        (function (lightbox) {
            if (lightbox && lightbox.classList.contains('show')) {
                lightbox.removeAttribute('tabindex');
                document.querySelectorAll('.tmb-lightbox-buttons a').forEach(function (anchor) {
                    anchor.setAttribute('tabindex', '-1');
                });
                lightbox.classList.remove('show');
                lightbox.blur();
            }
        }(document.querySelector('.tmb-lightbox-wrapper')));

// Delete the clonedImage:
        (function (clonedImage) {
            if (clonedImage) {
                clonedImage.remove();
                clonedImage = null;
            }
        }(document.querySelector('.cloned-image')));

// Restore default so that it opens in its initial state the next time:
        o.appendToCSS(':root', '{ --cloned-image-scale: 1; }');
        o.appendToCSS(':root', '{ --cloned-image-object-position: 50% 50%; }');

// restore tabbing outside lightbox:
        document.querySelectorAll(':not(.tmb-lightbox-wrapper) [data-tmb-tabindex]').forEach(function (element) {
            if (element.hasAttribute('data-tmb-tabindex')) {
                element.setAttribute('tabindex', element.getAttribute('data-tmb-tabindex'));
                element.removeAttribute('data-tmb-tabindex');
            }
        });

// restore tabbing of anchors on the page:
        document.querySelectorAll('a[data-tmb-tabbable-anchor]').forEach(function (anchor) {
// restore any saved tabindex previously set:
            if (anchor.getAttribute('data-tmb-tabbable-anchor') !== '') {
                anchor.setAttribute('tabindex', anchor.getAttribute('data-tmb-tabbable-anchor'));
            } else {
                anchor.removeAttribute('tabindex');
            }
            anchor.removeAttribute('data-tmb-tabbable-anchor');
        });

// restore tabbing of buttons on the page:
        document.querySelectorAll('button[data-tmb-tabbable-button]').forEach(function (button) {
// restore any saved tabindex previously set:
            if (button.getAttribute('data-tmb-tabbable-button') !== '') {
                button.setAttribute('tabindex', button.getAttribute('data-tmb-tabbable-button'));
            } else {
                button.removeAttribute('tabindex');
            }
            button.removeAttribute('data-tmb-tabbable-button');
        });

        enableOrDisableZoomButtons();

// restore focus to tabbable parent of the source image (in this case, the
// PICTURE element that encloses the source IMG):
        (function (image) {
            if (image) {
                image.closest('.tmb-lightbox-source')?.focus({preventScroll: true});
                image.classList.remove('tmb-lightbox-current-source-img-element');
// delete the flag indicating that the image is the one currently being
// lightboxed:
                delete image.dataset.selected;
            }
        }(document.querySelector('.tmb-lightbox-current-source-img-element')));

    };

    getMatchingDimension = function (containerWidth, containerHeight, imageWidth, imageHeight, lightboxButtonsWidth) {
        var containerAspect;
        var imageAspect;

        if ((containerHeight === 0) || (imageHeight === 0)) {
            return false;
        }
// Calculate aspect ratios
        containerAspect = (containerWidth - lightboxButtonsWidth) / containerHeight;
        imageAspect = imageWidth / imageHeight;
// Compare aspect ratios
        if (imageAspect > containerAspect) {
            return 'width';
        } else {
            return 'height';
        }
    };

// Pass in the element with geometry to measure,
// the key for the geometries object under which to store that value,
// and the function to call once finished:
    getGeometry = function (element, key, callback) {
        var observer;
        observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
// entry.boundingClientRect stores all dimensions:
                geometries[key] = entry.boundingClientRect;
                if (callback !== null) {
                    callback(element);
                }
            });
            observer.disconnect();
        });
        observer.observe(element);
    };

// The following 5 functions are called in sequence, each calling getGeometry:

    getOriginalImageGeometry = function (originalImage) {
        getGeometry(originalImage, 'originalImage', getLightboxContentGeometry);
    };

    getLightboxContentGeometry = function () {
        (function (lightboxContent) {
            if (lightboxContent) {
                getGeometry(lightboxContent, 'lightboxContent', getLightboxButtonsGeometry);
            }
        }(document.querySelector('.tmb-lightbox-content')));
    };

    getLightboxButtonsGeometry = function () {
        (function (lightboxButtons) {
            if (lightboxButtons) {
                getGeometry(lightboxButtons, 'lightboxButtons', getClonedImageGeometry);
            }
        }(document.querySelector('.tmb-lightbox-buttons')));
    };

    getClonedImageGeometry = function (ignore) {
        (function (clonedImage) {
            if (clonedImage) {
                getGeometry(clonedImage, 'clonedImage', initializeDraggableEvents);
            }
        }(document.querySelector('.cloned-image')));
    };

// When magnifying by pinch-zooming, we need to call this routine as well:
    getZoomReciprocal = function () {
        if (currentZoom() === 1) {
            return window.visualViewport.scale / currentZoom();
        } else {
            if (zoomInButton()) {
                return 1 / currentZoom();
            } else if (zoomOutButton()) {
                return 1 / currentZoom();
            } else {
                return window.visualViewport.scale / currentZoom();
            }
        }
    };

    initializeDraggableEvents = function (clonedImage) {

        var _newX;
        var _newY;
        var actualClonedImageHeight;
        var actualClonedImageWidth;
        var clonedImageHeight;
        var clonedImageWidth;
        var cursorXstart;
        var cursorYstart;
        var diffSpread;
        var eCache;
        var imageXpos;
        var imageYpos;
        var lightboxButtonsWidth;
        var lightboxContentHeight;
        var lightboxContentWidth;
        var matchingDimension;
        var originalImageHeight;
        var originalImageWidth;
        var pointerDownHandler;
        var pointerMoveHandler;
        var pointerUpHandler;
        var pointerXstart;
        var pointerYstart;
        var prevDiff;
        var rafTimeout;
        var removeEvent;
        var removePointerEventListeners;

        eCache = [];
        prevDiff = -1;
// Without this (i.e., when the spread is 0), there's quite a bit of screen
// jank when pinch-zooming, and the image may shoot in the direction you were
// expanding one of your fingers when you release. Use a diffSpread helps
// prevent/control that:
        diffSpread = 3;

// Problem: the clonedImage takes on the height and width of the lightboxContainer
// The height will be right, but the width will be wrong.
// The solution here is to retrieve the height and width of the original image
// and determine the clonedImage width by ratio to the original image.

        lightboxContentHeight = geometries.lightboxContent.height;
        lightboxContentWidth = geometries.lightboxContent.width;

        originalImageHeight = geometries.originalImage.height;
        originalImageWidth = geometries.originalImage.width;

        if ((originalImageHeight === 0) || (originalImageWidth === 0)) {
            console.log('Error: image with 0 for height or width');
            return false;
        }

        clonedImageHeight = geometries.clonedImage.height;
        clonedImageWidth = geometries.clonedImage.width;

// When the cloned image is placed in the container, either its height or
// width will match that of the container, whose shape and orientation cannot
// be predicted in advance (whether the container is landscape or portrait
// depends on window width, etc.) So, compute which dimension of the cloned
// image will match that of the container:

        lightboxButtonsWidth = geometries.lightboxButtons.width;

        matchingDimension = getMatchingDimension(lightboxContentWidth, lightboxContentHeight, originalImageWidth, originalImageHeight, lightboxButtonsWidth);

        if (matchingDimension === 'height') {
// the top and bottom of the cloned image meet the top and bottom of the container
// NB: here we get the cloned image *width*
            actualClonedImageWidth = ((originalImageWidth * clonedImageHeight) / originalImageHeight);
        } else if (matchingDimension === 'width') {
// the sides of the cloned image meet the sides of the container
// NB: here we get the cloned image *height*
            actualClonedImageHeight = ((originalImageHeight * clonedImageWidth) / originalImageWidth);
        } else {
// matchingDimension will return Boolean 'false' if division by zero is
// attempted; report it here:
            console.log('Division by zero');
        }

        if (imageXpos === undefined) {
            imageXpos = 0;
        }
        if (imageYpos === undefined) {
            imageYpos = 0;
        }

        cursorXstart = geometries.clonedImage.x;
        cursorYstart = geometries.clonedImage.y;

        pointerXstart = cursorXstart;
        pointerYstart = cursorYstart;

// The MouseEvents layerX and layerY are not standardized, yet they are
// supported by all browsers, and have been since their early versions:

        lastMoveZoomLevel = 0;

// qwer
        removeEvent = function (e) {
            var index = eCache.findIndex((item) => item.pointerId === e.pointerId);
            if (index !== -1) {
                eCache.splice(index, 1);
            }
        };

// For finger/pointer-based interaction:
        pointerMoveHandler = function (e) {
            var countDown;
            var countUp;
            var curDiff;
            var drag;
            var index;
            var movePointer;
            var pinchZoom;
            var pointer;
            var zoomReciprocal;

//console.log('pointerMoveHandler');

// To prevent this error, which occurs on occasionally but must be handles:
// [Intervention] Ignored attempt to cancel a pointerstart event with
// cancelable=false, for example because scrolling is in progress and cannot
// be interrupted.
            if (e.cancelable) {
                e.preventDefault();
            }
            e.stopPropagation();

// If there's a timer, cancel it
            if (rafTimeout) {
                window.cancelAnimationFrame(rafTimeout);
            }

            drag = function () {
//console.log('drag');
                if (getFirstDrag()) {
//console.log('firstDrag');
                    if (matchingDimension === 'height') {
// the top and bottom of the cloned image meet the top and bottom of the container
                        imageXpos = (((geometries.lightboxContent.width - lightboxButtonsWidth) * 0.5) - (actualClonedImageWidth * 0.5));
                        imageYpos = 0;
                    } else {
// the sides of the cloned image meet the sides of the container
                        imageXpos = 0;
                        imageYpos = ((geometries.lightboxContent.height * 0.5) - (actualClonedImageHeight * 0.5));
                    }
                    setFirstDrag(false);
                }

// After zooming with the lightbox controls, one of these will be set to true.
// This filters for the first mousemove following zooming:

                if (zoomInButton() || zoomOutButton()) {
//console.log('zoomInButton || zoomOutButton');
                    if (matchingDimension === 'height') {
// the top and bottom of the cloned image meet the top and bottom of the container
                        if (imageXpos === 0) {
                            imageXpos = (((geometries.lightboxContent.width - lightboxButtonsWidth) * 0.5) - (actualClonedImageWidth * 0.5));
                        }
                    } else {
// the sides of the cloned image meet the sides of the container
                        if (imageYpos === 0) {
                            imageYpos = ((geometries.lightboxContent.height * 0.5) + (actualClonedImageHeight * 0.5));
                        }
                    }

// This works for landscape images juat as well as for portrait images:
                    if (currentZoom() !== 1) {
// When zooming in:
                        if (lastMoveZoomLevel < currentZoom()) {
                            countDown = currentZoom();
                            countUp = lastMoveZoomLevel;
                            while (countDown >= (lastMoveZoomLevel + 1)) {
                                countUp += 1;
                                if (countUp !== 1) {
                                    imageXpos += (imageXpos * (1 / (countUp - 1)));
                                    imageYpos += (imageYpos * (1 / (countUp - 1)));
                                }
                                countDown -= 1;
                            }
// When zooming out:
                        } else {
                            countUp = currentZoom();
                            countDown = lastMoveZoomLevel;
                            while (countUp < lastMoveZoomLevel) {
                                countDown -= 1;
                                if (countDown !== 1) {
                                    imageXpos -= (imageXpos * (1 / (countDown + 1)));
                                    imageYpos -= (imageYpos * (1 / (countDown + 1)));
                                }
                                countUp += 1;
                            }
                        }
                    }

// cancel:
                    setZoomInButton(false);
                    setZoomOutButton(false);

                }

                pointer = e;
                _newX = (imageXpos + (pointer.clientX - pointerXstart));
                _newY = (imageYpos + (pointer.clientY - pointerYstart));

                _newX *= zoomReciprocal;
                _newY *= zoomReciprocal;

//console.log('_newX = ' + _newX);
//console.log('_newY = ' + _newY);

                o.appendToCSS(':root', '{--cloned-image-object-position: ' + _newX + 'px ' + _newY + 'px; }');
                lastMoveZoomLevel = currentZoom();

            };

            pinchZoom = function () {
//console.log('pinchZoom');

// Calculate the distance between the two pointers
                curDiff = Math.sqrt(Math.pow(eCache[1].clientX - eCache[0].clientX, 2) + Math.pow(eCache[1].clientY - eCache[0].clientY, 2));

// If the distance between the two pointers has increased...
                if (prevDiff > 0) {
// ...then zoom in
                    if (curDiff > (prevDiff + diffSpread)) {
                        if (currentZoom() < zoomMax) {
                            modifyZoom(1);
                            o.appendToCSS(':root', '{ --cloned-image-scale: ' + currentZoom() + '; }');
                            enableOrDisableZoomButtons();
                            setDraggable();
// Exit the routine to prevent uncontrollable zooming
// This ensures a maximum of one zoom level change per pinch zoom:
                            pointerUpHandler(e);
                        }
                    }
// If the distance between the two pointers has decreased...
                    if (curDiff < (prevDiff - diffSpread)) {
// ...then zoom out
                        if (currentZoom() > zoomMin) {
                            modifyZoom(-1);
                            o.appendToCSS(':root', '{ --cloned-image-scale: ' + currentZoom() + '; }');
                            enableOrDisableZoomButtons();
                            setDraggable();
                            if (currentZoom() === 1) {
                                setFirstDrag(true);
                                o.appendToCSS(':root', '{--cloned-image-object-position: center center; }');
                                lastMoveZoomLevel = 0;
                            }
// Exit the routine to prevent uncontrollable zooming
// This ensures a maximum of one zoom level change per pinch zoom:
                            pointerUpHandler(e);
                        }

                    }
                }
// Cache the distance for the next move event
                prevDiff = curDiff;
            };

            movePointer = function () {
                if (e.pointerType === 'touch' || e.pointerType === 'pen' || e.pointerType === 'mouse') {

                    zoomReciprocal = getZoomReciprocal();

                    index = eCache.findIndex((item) => e.pointerId === item.pointerId);

                    if (index !== -1) {
                        eCache[index] = e;
                    }

                    if (e.pointerType === 'touch') {
    // If two pointers are down, check for pinch gestures
                        if (eCache.length === 2) {
                            pinchZoom();
                        } else {
                            drag();
                        }
                    } else {
                        drag();
                    }
                }
            };

            rafTimeout = window.requestAnimationFrame(movePointer);

        };

// NB: Safari defaults to {passive: true}, so it must be explicitly canceled here.
// If {passive: false} is not used, then the screen scrolls behind the lightbox,
// and on slower connections the window itself rather than the image in the lightbox
// will respond to the pinch-zoom controls.

        pointerUpHandler = function (e) {
//console.log('pointerUpHandler');
            var zoomReciprocal;

// To prevent this error, which occurs on occasionally but must be handles:
// [Intervention] Ignored attempt to cancel a pointerstart event with
// cancelable=false, for example because scrolling is in progress and cannot
// be interrupted.
            if (e.cancelable) {
                e.preventDefault();
            }
            e.stopPropagation();

            if (e.pointerType === 'touch' || e.pointerType === 'pen' || e.pointerType === 'mouse') {

    // Remove this pointer from the cache
                removeEvent(e);
    // If the number of pointers down is less than two, then reset the difference tracker
                if (eCache.length < 2) {
                    prevDiff = -1;
                }


                if (rafTimeout) {
                    window.cancelAnimationFrame(rafTimeout);
                }

                setZoomInButton(false);
                setZoomOutButton(false);

                zoomReciprocal = window.visualViewport.scale / currentZoom();
                clonedImage.removeEventListener('pointermove', pointerMoveHandler, {passive: false});
                clonedImage.removeEventListener('pointerup', pointerMoveHandler, {passive: false});

// We must remove the zoomReciprocal-level calibration performed during the drag function, otherwise the
// the calculation of the pointer/finger position will be wrong when the image is moved a second
// time during the same session:
                imageXpos = _newX / zoomReciprocal;
                imageYpos = _newY / zoomReciprocal;
            }
        };

        pointerDownHandler = function (e) {
//console.log('pointerDownHandler');
            var pointer;

// To prevent this error, which occurs on occasionally but must be handles:
// [Intervention] Ignored attempt to cancel a pointerstart event with
// cancelable=false, for example because scrolling is in progress and cannot
// be interrupted.
            if (e.cancelable) {
                e.preventDefault();
            }
            e.stopPropagation();

// The pointerdown event signals the start of a pointer interaction.
// This event is cached to support 2-finger gestures
            eCache.push(e);

            if (e.pointerType === 'touch' || e.pointerType === 'pen' || e.pointerType === 'mouse') {
                clonedImage.removeEventListener('pointermove', pointerMoveHandler, {passive: false});
                if (clonedImage.hasAttribute('data-draggable')) {
                    pointer = e;
                    pointerXstart = pointer.clientX;
                    pointerYstart = pointer.clientY;
                    clonedImage.addEventListener('pointermove', pointerMoveHandler, {passive: false});
                    clonedImage.addEventListener('pointerup', pointerUpHandler, {passive: false});
                }
            }
        };
        clonedImage.addEventListener('pointerdown', pointerDownHandler, {passive: false});

// Remove the mouse event listeners when the lightbox is closed:
        removePointerEventListeners = function () {
            lightboxCloseBtn.removeEventListener('click', removePointerEventListeners);
            lightboxNegativeSpace.removeEventListener('click', removePointerEventListeners);
            clonedImage.removeEventListener('pointerdown', pointerDownHandler, {passive: false});
            clonedImage.removeEventListener('pointermove', pointerMoveHandler, {passive: false});
            clonedImage.removeEventListener('pointerup', pointerUpHandler, {passive: false});
        };
// When exit button is clicked
        lightboxCloseBtn.addEventListener('click', removePointerEventListeners);
// When negative space is clicked
        lightboxNegativeSpace.addEventListener('click', removePointerEventListeners);

    };

// Set Image Viewer as Draggable when zoomed-in
    setDraggable = function () {
// Since this is called by an eventListener, we must select the clonedImage
// via querySelector rather than rely on the global clonedImage, as its
// reference is fixed at the time of the initialization of the eventListener
// (i.e., null)
        (function (clonedImage) {
            if (clonedImage) {
// Allow image to be zoomable at size 1:
                if (currentZoom() >= 1) {
                    clonedImage.dataset.draggable = '';
                } else {
                    delete clonedImage.dataset.draggable;
                }
            }
        }(document.querySelector('.cloned-image')));
    };

    modifyZoom = function (change) {
        function newZoom(clonedImage) {
            var zoom;
            if (clonedImage) {
                zoom = parseInt(clonedImage.dataset.zoom, 10);
                zoom += change;
                zoom = (
                    (zoom < zoomMin)
                    ? zoomMin
                    : (zoom > zoomMax)
                    ? zoomMax
                    : zoom
                );
                clonedImage.dataset.zoom = zoom;
            }
            return zoom;
        }
        return newZoom(document.querySelector('.cloned-image'));
    };

    currentZoom = function () {
        function returnCurrentZoom(clonedImage) {
            var zoom;
            if (clonedImage) {
                zoom = parseInt(clonedImage.dataset.zoom, 10);
            }
            return zoom;
        }
        return returnCurrentZoom(document.querySelector('.cloned-image'));
    };

    setFirstDrag = function (change) {
        (function (clonedImage) {
            if (clonedImage) {
                if (change === true) {
                    clonedImage.dataset.firstDrag = '';
                } else {
                    delete clonedImage.dataset.firstDrag;
                }
            }
        }(document.querySelector('.cloned-image')));
    };

    getFirstDrag = function () {
        function returnFirstDrag(clonedImage) {
            var firstDrag;
            if (clonedImage) {
                firstDrag = (clonedImage.hasAttribute('data-first-drag'));
            }
            return firstDrag;
        }
        return returnFirstDrag(document.querySelector('.cloned-image'));
    };

// We need to wait until the animation is finished before
// we collect the geometries, as the various elements won't
// be at their final size until the animation is complete.
// Also, the Lightbox can't be focused until after the animation
// is complete.

    showLightboxAnimationEnd = function (event) {
// Check if the animation name matches the keyframes name ('fade' in this case)
        if (event.animationName === 'fade') {
// We're truly at the end of the fade keyframes animation.
// Proceed with the work that requires full size expansion of the lightbox:
            (function (image) {
                if (image) {
                    getOriginalImageGeometry(image);
                    (function (lightbox) {
                        if (lightbox) {
                            lightbox.focus();
                        }
                    }(document.querySelector('.tmb-lightbox-wrapper')));
                }
// Select the .tmb-lightbox-source that's the source of the current lightbox,
// in case multiple images are marked to be lightboxable on a given page:
            }(document.querySelector('.work-image .tmb-lightbox-source img[data-selected]')));
// Remove the event listener if you only need to detect it once
            event.target.removeEventListener('animationend', showLightboxAnimationEnd);
        }
    };


// Show Image Viewer Overlay
    showLightbox = function () {

// set height of underlay BEFORE activating it:
// retrieving the scrollHeight this way causes no reflow:
// Needed for .tmb-lightbox-backdrop and for .tmb-lightbox-negative-space
        o.appendToCSS(':root', '{ --document-scroll-height: ' + document.documentElement.scrollHeight + 'px; }');
// classList.add will not add duplicate classes, so no need to check if .show
// is already present:
        (function (lightbox) {
            if (lightbox) {

// confine tabbing to lightbox while open:
                document.querySelectorAll(':not(.tmb-lightbox-wrapper) [tabindex]').forEach(function (element) {
                    element.setAttribute('data-tmb-tabindex', element.getAttribute('tabindex'));
                    element.setAttribute('tabindex', -1);
                });

// disable tabbing of anchors on the page:
                document.querySelectorAll(':not(.tmb-lightbox-wrapper) a').forEach(function (anchor) {
// save any tabindex already set:
                    if (anchor.hasAttribute('tabindex')) {
                        anchor.setAttribute('data-tmb-tabbable-anchor', anchor.getAttribute('tabindex'));
                    } else {
                        anchor.setAttribute('data-tmb-tabbable-anchor', '');
                    }
                    anchor.setAttribute('tabindex', -1);
                });

// disable tabbing of buttons on the page:
                document.querySelectorAll(':not(.tmb-lightbox-wrapper) button').forEach(function (button) {
// save any tabindex already set:
                    if (button.hasAttribute('tabindex')) {
                        button.setAttribute('data-tmb-tabbable-button', button.getAttribute('tabindex'));
                    } else {
                        button.setAttribute('data-tmb-tabbable-button', '');
                    }
                    button.setAttribute('tabindex', -1);
                });

// Set normal tabindexs on lightbox and its anchors:
                lightbox.setAttribute('tabindex', '0');
                document.querySelectorAll('.tmb-lightbox-buttons a').forEach(function (anchor) {
                    anchor.setAttribute('tabindex', '0');
                });

                lightbox.addEventListener('animationend', showLightboxAnimationEnd);
                lightbox.classList.add('show');

                zoomCount = 0;

            }
        }(document.querySelector('.tmb-lightbox-wrapper')));

    };

    enableOrDisableZoomButtons = function () {
        (function (clonedImage) {
            var zoom;
            if (clonedImage) {
                zoom = parseInt(clonedImage.dataset.zoom, 10);
                if (zoom >= zoomMax) {
                    lightboxZoomInBtn.disabled = true;
                } else {
                    lightboxZoomInBtn.disabled = false;
                }
                if (zoom <= zoomMin) {
                    lightboxZoomOutBtn.disabled = true;
                } else {
                    lightboxZoomOutBtn.disabled = false;
                }
            }
        }(document.querySelector('.cloned-image')));
    };

    zoomInButton = function () {
        return (lightboxContent.dataset.zoomInButton === 'true');
    };

    zoomOutButton = function () {
        return (lightboxContent.dataset.zoomOutButton === 'true');
    };

    setZoomInButton = function (value) {
        lightboxContent.setAttribute('data-zoom-in-button', value);
    };

    setZoomOutButton = function (value) {
        lightboxContent.setAttribute('data-zoom-out-button', value);
    };

/////////////////////
// Event Listeners //
/////////////////////

    zoomIn = function (e) {
        e.preventDefault();
        if (currentZoom() < zoomMax) {
            modifyZoom(1);
            o.appendToCSS(':root', '{ --cloned-image-scale: ' + currentZoom() + '; }');
            zoomCount += 1;
            enableOrDisableZoomButtons();
            setDraggable();
            setZoomInButton(true);
        }
    };


    zoomOut = function (e) {
        e.preventDefault();
        if (currentZoom() > zoomMin) {
            modifyZoom(-1);
            o.appendToCSS(':root', '{ --cloned-image-scale: ' + currentZoom() + '; }');
            zoomCount -= 1;
            enableOrDisableZoomButtons();
            setDraggable();
            if (currentZoom() === 1) {
                setFirstDrag(true);
                zoomCount = 0;
                o.appendToCSS(':root', '{--cloned-image-object-position: center center; }');
                lastMoveZoomLevel = 0;
            }
            setZoomOutButton(true);
        }
    };


    zoomReset = function (e) {
        e.preventDefault();
        o.appendToCSS(':root', '{ --cloned-image-scale: 1; }');
        zoomCount = 0;
        enableOrDisableZoomButtons();
        setDraggable();
        (function (clonedImage) {
            if (clonedImage) {
                clonedImage.dataset.zoom = 1;
            }
        }(document.querySelector('.cloned-image')));
        setFirstDrag(true);
        o.appendToCSS(':root', '{--cloned-image-object-position: center center; }');
        lastMoveZoomLevel = 0;
    };

    debounce = function (callback, delay = 1000) {
        var timeout;
        return function (...args) {
            window.clearTimeout(timeout);
            timeout = window.setTimeout(function () {
                callback(...args);
            }, delay);
        };
    };

// Necessary for adjusting the lightbox when the window itself is adjusted:

    variableUpdateOnWindowResize = function () {
        var left;
        var scale;
        var top;

        scale = 1 / window.visualViewport.scale;
        left = window.visualViewport.offsetLeft;
        top = window.visualViewport.offsetTop;

        o.appendToCSS(':root', '{--lightbox-scale: ' + scale + '; }');
        o.appendToCSS(':root', '{--lightbox-top: ' + top + 'px; }');
        o.appendToCSS(':root', '{--lightbox-left: ' + left + 'px; }');

    };

// Necessary so that the lightbox is scaled to the viewport on mobile if the
// user has pinch-zoomed the window itself to a different size before opening
// the lightbox:

    variableUpdateOnViewportResize = function () {
        (function (lightboxContent) {

            var calculateOffset;
            var callback;
            var centerOffsetX;
            var centerOffsetY;
            var lightboxScale;

// windowMeasurement will either be width or height
// lightboxMeasurement will likewise be either width or height
// lightboxScale is inverse of zoom factor (if zoom = 2, scale = .5)
// offset is top or left
            calculateOffset = function (windowMeasurement, lightboxMeasurement, lightboxScale, offset) {

                var fullDocSize;
                var halfNegativeSpace;
                var lightboxSize;
                var distanceToCenter;

                fullDocSize = windowMeasurement * window.visualViewport.scale;
                lightboxSize = lightboxMeasurement * window.visualViewport.scale;
                halfNegativeSpace = ((fullDocSize - lightboxSize) * 0.5) * lightboxScale;
                distanceToCenter = (((windowMeasurement - lightboxSize) * 0.5) * lightboxScale);

                return distanceToCenter + offset - halfNegativeSpace;

            };

            callback = function () {
                lightboxScale = 1 / window.visualViewport.scale;
                centerOffsetX = calculateOffset(window.innerWidth, geometries.pzLightboxContent.height, lightboxScale, window.visualViewport.offsetLeft);
                centerOffsetY = calculateOffset(window.innerHeight, geometries.pzLightboxContent.height, lightboxScale, window.visualViewport.offsetTop);
                o.appendToCSS(':root', '{--lightbox-scale: ' + lightboxScale + '; }');
                o.appendToCSS(':root', '{--lightbox-left: ' + centerOffsetX + 'px; }');
                o.appendToCSS(':root', '{--lightbox-top: ' + centerOffsetY + 'px; }');
            };

            if (lightboxContent) {
// To avoid reflow caused by .getBoundingClientRect(), retrieve geometries
// using IntersectionObserver:
                getGeometry(lightboxContent, 'pzLightboxContent', callback);
            }

        }(document.querySelector('.tmb-lightbox-content')));

    };


    addEventListeners = function () {

        var windowResizeHandler;
        var viewportResizeHandler;

// The elements are flagged with special classes when the event listeners are
// added to them. If the classes are present, then the event listeners won't
// be added redundantly.

// When Zoom-In Button is clicked
        if (!lightboxZoomInBtn.classList.contains('lightbox-click-listener')) {
            lightboxZoomInBtn.classList.add('lightbox-click-listener');
            lightboxZoomInBtn.addEventListener('click', zoomIn);
        }

// When Zoom-Out Button is clicked
        if (!lightboxZoomOutBtn.classList.contains('lightbox-click-listener')) {
            lightboxZoomOutBtn.classList.add('lightbox-click-listener');
            lightboxZoomOutBtn.addEventListener('click', zoomOut);
        }

// When zoom to center button is clicked
        if (!lightboxZoomResetBtn.classList.contains('lightbox-click-listener')) {
            lightboxZoomResetBtn.classList.add('lightbox-click-listener');
            lightboxZoomResetBtn.addEventListener('click', zoomReset);
        }

// When exit button is clicked
        if (!lightboxCloseBtn.classList.contains('lightbox-click-listener')) {
            lightboxCloseBtn.classList.add('lightbox-click-listener');
            lightboxCloseBtn.addEventListener('click', closeLightbox);
        }

// When negative space is clicked
        if (!lightboxNegativeSpace.classList.contains('lightbox-click-listener')) {
            lightboxNegativeSpace.classList.add('lightbox-click-listener');
            lightboxNegativeSpace.addEventListener('click', closeLightbox);
        }

        viewportResizeHandler = debounce(variableUpdateOnViewportResize);
        windowResizeHandler = debounce(variableUpdateOnWindowResize);

// This should be called first regardless:
        windowResizeHandler();

// If they were added previously, remove any old event listeners:
        window.visualViewport.removeEventListener('resize', windowResizeHandler);
        window.removeEventListener('pointermove', viewportResizeHandler);
        window.removeEventListener('scroll', viewportResizeHandler);

// Now add them afresh:
        window.visualViewport.addEventListener('resize', windowResizeHandler);
        window.addEventListener('pointermove', viewportResizeHandler);
        window.addEventListener('scroll', viewportResizeHandler);

    };

////////////////////////////
// Initialize the routine //
////////////////////////////

    lightboxWrapperAnimationEnd = function (event) {
// Check if the animation name matches the keyframes name ('fade-out' in this case)
        if (event.animationName === 'fade-out') {
            o.appendToCSS(':root', '{--lightbox-wrapper-visibility: visible; }');
            event.target.removeEventListener('animationend', lightboxWrapperAnimationEnd);
        }
    };

    initialize = function () {

// The elements are flagged with special classes when the event listeners are
// added to them. If the classes are present, then the event listeners won't
// be added redundantly. It's therefore safe to call the addEventListeners()
// routine upon each initialization:

        addEventListeners();

        (function (lightboxViewer) {

            function onClickOrEnter(item) {
                (function (image) {
                    var fragment;
                    if (image) {
// pass in Boolean 'true' as argument to clone all descendent elements:
                        clonedImage = image.cloneNode(false);
                        fragment = document.createDocumentFragment();
                        fragment.appendChild(clonedImage);
                        clonedImage.classList.add('cloned-image');
                        clonedImage.dataset.draggable = '';
                        clonedImage.dataset.zoom = 1;
                        clonedImage.dataset.firstDrag = '';
                        lightboxViewer.appendChild(fragment);
                        image.classList.add('tmb-lightbox-current-source-img-element');
// necessary to distinguish which image has been clicked if multiple images on
// a page are marked to be lightboxed:
                        image.dataset.selected = '';
                        showLightbox();
                    }
                }(item.querySelector('.work-image .tmb-lightbox-source img')));
            }

// Show Image when image items are clicked
            if (lightboxViewer) {

                geometries = {};
                setFirstDrag(true);
                enableOrDisableZoomButtons();

                document.querySelectorAll('.tmb-lightbox-source').forEach(function (item) {
                    if (!item.classList.contains('lightbox-click-listener')) {
                        item.classList.add('lightbox-click-listener');
                        item.classList.add('initialized');
                        item.addEventListener('click', function () {
                            onClickOrEnter(item);
                        });
                        item.addEventListener('keydown', function (e) {
                            if (e.key === 'Enter') {
                                onClickOrEnter(item);
                            }
                        });
                    }
                });

// Wait until the lightbox is removed from the display before making it visible
// (otherwise, it will shoot offscreen when the page is first displayed):
                (function (lightboxWrapper) {
// Ensure the animationend listener is not added redundantly:
                    if (lightboxWrapper && !lightboxWrapper.classList.contains('lightbox-wrapper-animation-end')) {
                        lightboxWrapper.classList.add('lightbox-wrapper-animation-end');
                        lightboxWrapper.addEventListener('animationend', lightboxWrapperAnimationEnd);
                    }
                }(document.querySelector('.tmb-lightbox-wrapper')));

            }
        }(document.querySelector('.tmb-lightbox-viewer')));

    };

    initialize();

}());
