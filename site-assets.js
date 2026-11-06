// Production assets are always served from this website.
window.siteImage = (image, localPath) => {
  image.src = localPath && !/^(?:https?:)?\/\//i.test(localPath) ? localPath : 'assets/site-images/image-pending.svg';
};
