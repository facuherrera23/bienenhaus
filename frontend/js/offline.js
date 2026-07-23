document.addEventListener('DOMContentLoaded', function() {
  var btn = document.getElementById('retryBtn');
  if (btn) btn.addEventListener('click', function() { location.reload(); });
});
