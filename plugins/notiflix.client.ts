import Notiflix from 'notiflix'

export default defineNuxtPlugin(() => {
  Notiflix.Report.init({
    titleFontSize: '24px',
    messageFontSize: '18px',
    buttonFontSize: '16px',
    backOverlayClickToClose: true,
    cssAnimationDuration: 200,
  })

  Notiflix.Notify.init({
    fontSize: '18px',
  })

  Notiflix.Confirm.init({
    titleFontSize: '24px',
    messageFontSize: '18px',
    buttonsFontSize: '16px',
    cssAnimationDuration: 200,
    width: '400px',
    titleColor: '#f0b100',
    okButtonBackground: '#f0b100',
  })
})
