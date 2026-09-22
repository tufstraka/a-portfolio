// Keep phones out of the WebGL boot path until the touch experience is ready.
const phone = matchMedia('(pointer: coarse) and (max-width: 767px), (pointer: coarse) and (max-height: 600px)').matches || /iPhone|iPod|Android.*Mobile/i.test(navigator.userAgent);
if (phone) {
 document.documentElement.dataset.phone = 'true';
 document.getElementById('mobileGate').setAttribute('role', 'main');
} else {
 import('./main.js');
}
