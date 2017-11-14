export default ({ target, stack }) => {
  var mod = {};

  mod.sendEvent = (args) => {
      for (var key in stack) {
          stack[key](args)
      }
  }

  var ev = mod.evlt = {
  resizer: () => {
    if (!target) { return }
    mod.rect = target.getBoundingClientRect()
    mod.aspect = mod.rect.width / mod.rect.height
    mod.sendEvent({ type: 'resize', aspect: mod.aspect, rect: mod.rect })
  },
  tsData: false,
  tmData: false,
  emitClick: false,
  onTS: (evt) => {
    evt.preventDefault()
    ev.tsData = { type: 'click', isIn: true, touches: evt.touches, pageX: evt.touches[0].pageX, pageY: evt.touches[0].pageY, rect: mod.rect }
    ev.emitClick = true
    setTimeout(() => {
      ev.emitClick = false
    }, 300)
    mod.sendEvent({ type: 'ts', isIn: true, touches: evt.touches, pageX: evt.touches[0].pageX, pageY: evt.touches[0].pageY, rect: mod.rect })
  },
  onTM: (evt) => {
    evt.preventDefault()
    mod.sendEvent({ type: 'tm', touches: evt.touches, pageX: evt.touches[0].pageX, pageY: evt.touches[0].pageY, rect: mod.rect })
  },
  onTE: (evt) => {
    if (ev.emitClick) {
      ev.emitClick = false
      mod.sendEvent(ev.tsData)
    }
    mod.sendEvent({ type: 'te', isIn: false })
  },
  onMDN: (evt) => {
    mod.sendEvent({ type: 'mdn', pageX: evt.clientX, pageY: evt.clientY, rect: mod.rect })
  },
  onMUP: (evt) => {
    mod.sendEvent({ type: 'mup', pageX: evt.clientX, pageY: evt.clientY, rect: mod.rect })
  },
  onMV: (evt) => {
    evt.preventDefault()
    mod.sendEvent({ type: 'mv', pageX: evt.pageX, pageY: evt.pageY, rect: mod.rect })
  },
  onMO: (evt) => {
    mod.sendEvent({ isIn: true })
  },
  onME: (evt) => {
    mod.sendEvent({ isIn: true })
  },
  onML: (evt) => {
    mod.sendEvent({ isIn: false })
  },
  onCL: (evt) => {
    mod.sendEvent({ type: 'click', pageX: evt.pageX, pageY: evt.pageY, rect: mod.rect })
  },
  onWHL: (evt) => {
    mod.sendEvent({ type: 'wheel', deltaX: evt.deltaX, deltaY: evt.deltaY })
  }
  }
  ev.resizer()

  var container = target
  container.addEventListener('mouseover', ev.onMO, false)
  container.addEventListener('mouseenter', ev.onME, false)
  container.addEventListener('mouseleave', ev.onML, false)

  container.addEventListener('mousemove', ev.onMV, false)
  container.addEventListener('mousedown', ev.onMDN, false)
  container.addEventListener('mouseup', ev.onMUP, false)

  container.addEventListener('click', ev.onCL, false)
  container.addEventListener('wheel', ev.onWHL, false)

  container.addEventListener('touchstart', ev.onTS, false)
  container.addEventListener('touchmove', ev.onTM, false)
  container.addEventListener('touchend', ev.onTE, false)
  container.style['-webkit-tap-highlight-color'] = `rgba(0,0,0,0)`
  window.addEventListener('resize', ev.resizer, false)
  mod.uninstaller = () => {
      container.removeEventListener('mouseover', ev.onMO)
      container.removeEventListener('mouseenter', ev.onME)
      container.removeEventListener('mouseleave', ev.onML)

      container.removeEventListener('mousemove', ev.onMV)
      container.removeEventListener('mousedown', ev.onMDN)
      container.removeEventListener('mouseup', ev.onMUP)

      container.removeEventListener('click', ev.onCL)
      container.removeEventListener('wheel', ev.onWHL)

      container.removeEventListener('touchstart', ev.onTS)
      container.removeEventListener('touchmove', ev.onTM)
      container.removeEventListener('touchend', ev.onTE)
      window.removeEventListener('resize', ev.resizer)
  }

  return mod;
}