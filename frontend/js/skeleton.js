// ── SKELETON LOADING ──────────────────────────────────────────────
function showSkeletons(n = 6) {
  const grid = document.getElementById('propsGrid');
  if (!grid) return;
  grid.innerHTML = Array.from({length: n}, () => `
    <div class="skeleton-card">
      <div class="skeleton skeleton-img"></div>
      <div class="skeleton-body">
        <div class="skeleton skeleton-line w-30"></div>
        <div class="skeleton skeleton-line w-80 h-20"></div>
        <div class="skeleton skeleton-line w-60"></div>
        <div class="skeleton-specs">
          <div class="skeleton"></div><div class="skeleton"></div><div class="skeleton"></div>
        </div>
        <div class="skeleton skeleton-line w-100"></div>
      </div>
    </div>`).join('');
}

function showRentalSkeletons(n = 6) {
  const grid = document.getElementById('rentalsGridIndex');
  if (!grid) return;
  grid.innerHTML = Array.from({length: n}, () => `
    <div class="skeleton-card">
      <div class="skeleton skeleton-img"></div>
      <div class="skeleton-body">
        <div class="skeleton skeleton-line w-30"></div>
        <div class="skeleton skeleton-line w-80 h-20"></div>
        <div class="skeleton skeleton-line w-60"></div>
        <div class="skeleton-specs">
          <div class="skeleton"></div><div class="skeleton"></div><div class="skeleton"></div>
        </div>
        <div class="skeleton skeleton-line w-100"></div>
      </div>
    </div>`).join('');
}
