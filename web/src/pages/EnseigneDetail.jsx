import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSetPageMeta } from '../context/PageMetaContext.jsx';
import { useCamera } from '../context/CameraContext.jsx';
import { ENSEIGNE_PHOTO_LABELS, ENSEIGNE_PHOTO_LABEL_TEXT } from '../constants.js';
import { api } from '../api.js';
import MicButton from '../components/MicButton.jsx';
import PhotoLightbox from '../components/PhotoLightbox.jsx';

function PhotoRow({ photos, onSelect }) {
  if (!photos.length) return null;
  return (
    <div style={{ display: 'flex', gap: 10, overflow: 'auto', paddingBottom: 2 }}>
      {photos.map((ph) => (
        <button
          key={ph.id}
          type="button"
          onClick={() => onSelect(ph)}
          style={{ flex: 'none', width: 112, height: 112, padding: 0, border: 0, cursor: 'pointer', borderRadius: 'var(--radius-md)', overflow: 'hidden', background: 'var(--color-neutral-200)' }}
        >
          <div style={{ width: '100%', height: '100%', backgroundImage: `url("${ph.url}")`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
        </button>
      ))}
    </div>
  );
}

export default function EnseigneDetail() {
  const { id, enseigneId } = useParams();
  const navigate = useNavigate();
  const { openCamera } = useCamera();

  const [tour, setTour] = useState(null);
  const [loading, setLoading] = useState(true);
  const [keyLearnings, setKeyLearnings] = useState('');
  const [productForm, setProductForm] = useState(false);
  const [productName, setProductName] = useState('');
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const [viewerPhoto, setViewerPhoto] = useState(null);

  const enseigne = tour ? tour.enseignes.find((e) => e.id === enseigneId) : null;

  useSetPageMeta({ kicker: 'Enseigne', heading: enseigne ? enseigne.name : 'Enseigne', showBack: true });

  async function load() {
    setLoading(true);
    try {
      const res = await api.foodTour(id);
      setTour(res.foodTour);
      const e = res.foodTour.enseignes.find((x) => x.id === enseigneId);
      setKeyLearnings(e ? e.keyLearnings : '');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, enseigneId]);

  function addLieuPhoto() {
    openCamera({
      uploadFn: (file, label) => api.uploadEnseignePhoto(id, enseigneId, file, label),
      labels: ENSEIGNE_PHOTO_LABELS.map((l) => ({ value: l, text: ENSEIGNE_PHOTO_LABEL_TEXT[l] })),
      onDone: (res) => setTour(res.foodTour)
    });
  }

  function addProductPhoto(productId) {
    openCamera({
      uploadFn: (file) => api.uploadProductPhoto(id, enseigneId, productId, file),
      labels: null,
      onDone: (res) => setTour(res.foodTour)
    });
  }

  async function saveKeyLearnings() {
    if (keyLearnings === (enseigne.keyLearnings || '')) return;
    const res = await api.updateEnseigne(id, enseigneId, { keyLearnings });
    setTour(res.foodTour);
  }

  async function addProduct() {
    setErr(null);
    if (!productName.trim()) {
      setErr('Le nom du produit est obligatoire.');
      return;
    }
    setBusy(true);
    try {
      const res = await api.createProduct(id, enseigneId, { name: productName });
      setTour(res.foodTour);
      setProductName('');
      setProductForm(false);
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function deleteProduct(productId) {
    const res = await api.deleteProduct(id, enseigneId, productId);
    setTour(res.foodTour);
  }

  async function saveComment(product, value) {
    if (value === (product.comment || '')) return;
    const res = await api.updateProduct(id, enseigneId, product.id, { comment: value });
    setTour(res.foodTour);
  }

  async function deleteEnseigne() {
    setBusy(true);
    try {
      await api.deleteEnseigne(id, enseigneId);
      navigate('/food-tour/' + id);
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <p style={{ fontSize: 13, color: 'var(--color-neutral-700)' }}>Chargement…</p>;
  if (!enseigne) {
    return (
      <div className="card" style={{ borderRadius: 'var(--radius-lg)', textAlign: 'center', padding: '30px 20px' }}>
        <div style={{ fontFamily: 'var(--font-heading)', fontSize: 16 }}>Enseigne introuvable</div>
        <button type="button" className="btn btn-secondary" style={{ marginTop: 10, borderRadius: 999 }} onClick={() => navigate('/food-tour/' + id)}>
          Retour
        </button>
      </div>
    );
  }

  const lieuPhotos = enseigne.photos.filter((p) => p.label === 'LIEU');
  const menuPhotos = enseigne.photos.filter((p) => p.label === 'MENU');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <section className="card elev-sm" style={{ borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h2 style={{ margin: 0, fontSize: 16 }}>Le lieu</h2>
        <PhotoRow photos={lieuPhotos} onSelect={setViewerPhoto} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--color-neutral-700)' }}>Carte / Menu</div>
          <PhotoRow photos={menuPhotos} onSelect={setViewerPhoto} />
        </div>
        <button type="button" className="btn btn-primary" style={{ borderRadius: 999, minHeight: 46 }} onClick={addLieuPhoto}>
          Ajouter une photo
        </button>
      </section>

      <section className="card elev-sm" style={{ borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <h2 style={{ margin: 0, fontSize: 16 }}>Key learnings</h2>
          <MicButton value={keyLearnings} onText={setKeyLearnings} />
        </div>
        <textarea
          className="input"
          style={{ borderRadius: 'var(--radius-md)', minHeight: 90 }}
          placeholder="Ce qu'il faut retenir de cette enseigne…"
          value={keyLearnings}
          onChange={(e) => setKeyLearnings(e.target.value)}
          onBlur={saveKeyLearnings}
        />
      </section>

      <section className="card elev-sm" style={{ borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h2 style={{ margin: 0, fontSize: 16 }}>Produits</h2>

        {enseigne.products.map((p) => (
          <ProductCard
            key={p.id}
            product={p}
            onAddPhoto={() => addProductPhoto(p.id)}
            onSaveComment={(v) => saveComment(p, v)}
            onDelete={() => deleteProduct(p.id)}
            onSelectPhoto={setViewerPhoto}
          />
        ))}

        <button type="button" className="btn btn-secondary" style={{ borderRadius: 999, minHeight: 44 }} onClick={() => setProductForm(!productForm)}>
          {productForm ? 'Annuler' : '+ Ajouter un produit'}
        </button>

        {productForm && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: 12, borderRadius: 'var(--radius-md)', background: 'var(--color-accent-100)', border: '1px solid var(--color-accent-300)' }}>
            <div className="field">
              <label>Nom du produit</label>
              <input className="input" style={{ borderRadius: 999, minHeight: 44 }} placeholder="ex. Burger signature" value={productName} onChange={(e) => setProductName(e.target.value)} />
            </div>
            {err && (
              <div style={{ borderRadius: 'var(--radius-md)', background: 'var(--color-accent-200)', color: 'var(--color-accent-800)', padding: '10px 13px', fontSize: 12.5 }}>{err}</div>
            )}
            <button type="button" className="btn btn-primary" disabled={busy} style={{ borderRadius: 999, minHeight: 44 }} onClick={addProduct}>
              Ajouter le produit
            </button>
          </div>
        )}
      </section>

      <section className="card elev-sm" style={{ borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <h2 style={{ margin: 0, fontSize: 16 }}>Supprimer l'enseigne</h2>
        {!confirmDel && (
          <button type="button" className="btn btn-secondary" style={{ borderRadius: 999, minHeight: 44 }} onClick={() => setConfirmDel(true)}>
            Supprimer « {enseigne.name} »
          </button>
        )}
        {confirmDel && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9, padding: 12, borderRadius: 'var(--radius-md)', background: 'var(--color-accent-200)' }}>
            <div style={{ fontSize: 12.5, color: 'var(--color-accent-800)' }}>Confirmer la suppression de « {enseigne.name} » ?</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" className="btn btn-primary" disabled={busy} style={{ borderRadius: 999, minHeight: 42, flex: 1 }} onClick={deleteEnseigne}>
                Supprimer
              </button>
              <button type="button" className="btn btn-secondary" style={{ borderRadius: 999, minHeight: 42, flex: 1 }} onClick={() => setConfirmDel(false)}>
                Annuler
              </button>
            </div>
          </div>
        )}
      </section>

      <PhotoLightbox photo={viewerPhoto} onClose={() => setViewerPhoto(null)} />
    </div>
  );
}

function ProductCard({ product, onAddPhoto, onSaveComment, onDelete, onSelectPhoto }) {
  const [comment, setComment] = useState(product.comment || '');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 12, borderRadius: 'var(--radius-md)', background: 'var(--color-neutral-100)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ fontSize: 14, fontWeight: 600 }}>{product.name}</div>
        <button
          type="button"
          className="btn btn-ghost"
          aria-label={'Supprimer ' + product.name}
          style={{ borderRadius: 999, minHeight: 32, padding: '0 10px', fontSize: 12 }}
          onClick={onDelete}
        >
          Supprimer
        </button>
      </div>
      <PhotoRow photos={product.photos} onSelect={onSelectPhoto} />
      <button type="button" className="btn btn-secondary" style={{ borderRadius: 999, minHeight: 40, fontSize: 12.5 }} onClick={onAddPhoto}>
        Ajouter une photo
      </button>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <label style={{ margin: 0, fontSize: 12 }}>Commentaire</label>
        <MicButton value={comment} onText={setComment} />
      </div>
      <textarea
        className="input"
        style={{ borderRadius: 'var(--radius-md)', minHeight: 60 }}
        placeholder="Votre avis sur ce produit…"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        onBlur={() => onSaveComment(comment)}
      />
    </div>
  );
}
