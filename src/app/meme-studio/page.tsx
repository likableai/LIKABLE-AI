'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AppLayout } from '@/components/AppLayout';
import {
  ImageIcon,
  Loader2,
  Download,
  RefreshCw,
  Upload,
  X,
} from 'lucide-react';
import type { MemeFormat, MemeStyle } from '@/lib/meme-templates';
import { MEME_STYLES } from '@/lib/meme-templates';
import { getMemeTemplates, getMemeStyles, getMemeProviders, generateMeme, resolveMemeFileUrl, type MemeTemplate, type MemeImageProvider } from '@/lib/api';

const SECTION_GAP = 'var(--space-6)';
const CARD_PADDING = 'var(--space-4)';

export default function MemeStudioPage() {
  const [templates, setTemplates] = useState<MemeTemplate[]>([]);
  const [idea, setIdea] = useState('');
  const [topText, setTopText] = useState('');
  const [bottomText, setBottomText] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('custom');
  const [styles, setStyles] = useState<string[]>([]);
  const [style, setStyle] = useState<string>('Classic');
  const [format, setFormat] = useState<MemeFormat>('image');
  const [imageProvider, setImageProvider] = useState<'gemini' | 'reve'>('gemini');
  const [geminiModel, setGeminiModel] = useState<'flash' | 'pro'>('flash');
  const [providers, setProviders] = useState<MemeImageProvider[]>([]);
  const [referenceFile, setReferenceFile] = useState<File | null>(null);
  const [referencePreview, setReferencePreview] = useState<string | null>(null);
  const [referenceUrl, setReferenceUrl] = useState('');
  const [referenceType, setReferenceType] = useState<'image' | 'gif' | 'video' | null>(null);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [generatedFormat, setGeneratedFormat] = useState<string>('image');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [overlayFontSize, setOverlayFontSize] = useState(32);
  const [overlayColor, setOverlayColor] = useState('#ffffff');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // Prefill from Explorer ?token=
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token && !idea) setIdea(`Create meme about ${token}`);
  }, [idea]);

  useEffect(() => {
    getMemeTemplates()
      .then(setTemplates)
      .catch(() => setTemplates([]));
  }, []);

  useEffect(() => {
    getMemeStyles()
      .then(setStyles)
      .catch(() => setStyles(Array.from(MEME_STYLES)));
  }, []);

  useEffect(() => {
    getMemeProviders()
      .then(setProviders)
      .catch(() => setProviders([]));
  }, []);

  const handleReferenceFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const type = file.type.startsWith('image/')
      ? file.type === 'image/gif'
        ? 'gif'
        : 'image'
      : file.type.startsWith('video/')
        ? 'video'
        : null;
    if (!type) return;
    setReferenceFile(file);
    setReferenceUrl('');
    const reader = new FileReader();
    reader.onload = () => setReferencePreview(reader.result as string);
    reader.readAsDataURL(file);
    setReferenceType(type);
  }, []);

  const clearReference = useCallback(() => {
    setReferenceFile(null);
    setReferencePreview(null);
    setReferenceUrl('');
    setReferenceType(null);
  }, []);

  const generate = useCallback(async () => {
    if (!idea.trim()) {
      setError('Enter a meme idea or caption.');
      return;
    }
    setLoading(true);
    setError(null);
    setGeneratedUrl(null);
    try {
      const body = {
        idea: idea.trim(),
        templateId: selectedTemplateId,
        format,
        style,
        imageProvider,
        geminiModel,
        topText: topText.trim(),
        bottomText: bottomText.trim(),
        ...(referenceUrl.trim() && {
          referenceUrl: referenceUrl.trim(),
          referenceType: referenceType || ('image' as const),
        }),
      };
      const data = await generateMeme(body);
      if (data.url) {
        setGeneratedUrl(data.url);
        setGeneratedFormat(data.format || 'image');
      }
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } }; message?: string };
      setError(err?.response?.data?.error ?? err?.message ?? 'Generation failed');
    } finally {
      setLoading(false);
    }
  }, [idea, selectedTemplateId, format, style, imageProvider, geminiModel, topText, bottomText, referenceUrl, referenceType]);

  const useTemplate = useCallback((t: MemeTemplate) => {
    setSelectedTemplateId(t.id);
    if (t.defaultTopText !== undefined) setTopText(t.defaultTopText);
    if (t.defaultBottomText !== undefined) setBottomText(t.defaultBottomText);
    if (t.style) setStyle(t.style);
    if (t.referenceUrl) {
      setReferenceUrl(t.referenceUrl);
      setReferenceType('image');
      setReferenceFile(null);
      setReferencePreview(t.referenceUrl);
    }
  }, []);

  const drawOverlay = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img || !img.complete || !img.naturalWidth) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    canvas.width = w;
    canvas.height = h;
    ctx.drawImage(img, 0, 0);
    ctx.fillStyle = overlayColor;
    ctx.strokeStyle = '#000';
    ctx.lineWidth = Math.max(2, w / 256);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const fontSize = Math.max(12, (overlayFontSize / 100) * Math.min(w, h));
    ctx.font = `bold ${fontSize}px sans-serif`;
    if (topText.trim()) {
      const x = w / 2;
      const y = h * 0.12;
      wrapStroke(ctx, topText, x, y, w * 0.9);
    }
    if (bottomText.trim()) {
      const x = w / 2;
      const y = h * 0.88;
      wrapStroke(ctx, bottomText, x, y, w * 0.9);
    }
  }, [topText, bottomText, overlayFontSize, overlayColor]);

  useEffect(() => {
    if (generatedUrl && generatedFormat === 'image') drawOverlay();
  }, [generatedUrl, generatedFormat, drawOverlay]);

  const resolvedUrl = generatedUrl ? resolveMemeFileUrl(generatedUrl) : null;

  const download = useCallback(() => {
    if (!resolvedUrl) return;
    if (generatedFormat === 'video') {
      const a = document.createElement('a');
      a.download = `likable-meme-${Date.now()}.mp4`;
      a.href = resolvedUrl;
      a.click();
      return;
    }
    if (generatedFormat === 'gif') {
      const a = document.createElement('a');
      a.download = `likable-meme-${Date.now()}.gif`;
      a.href = resolvedUrl;
      a.click();
      return;
    }
    const canvas = canvasRef.current;
    if (canvas) {
      const a = document.createElement('a');
      a.download = `likable-meme-${Date.now()}.png`;
      a.href = canvas.toDataURL('image/png');
      a.click();
    }
  }, [resolvedUrl, generatedFormat]);

  return (
    <AppLayout>
      <div className="container-padding mx-auto" style={{ maxWidth: 'var(--content-max-width)' }}>
        <header className="text-center section-spacing">
          <h1 className="page-title mb-4 tracking-tight">
            Crypto <span className="text-accent">Meme Studio</span>
          </h1>
          <p className="page-subtitle text-lg" style={{ color: 'var(--text-opacity-70)' }}>
            Create crypto memes with AI. Pick a template or use your own idea.
          </p>
        </header>

        {/* Meme Library */}
        <section className="card section-spacing" style={{ padding: CARD_PADDING }}>
          <h2 className="section-title mb-4">Meme Library</h2>
          <div
            className="grid gap-3"
            style={{
              gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
              gap: 'var(--space-3)',
            }}
          >
            {templates.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => useTemplate(t)}
                className="rounded-xl overflow-hidden border transition-all hover:opacity-90 focus:outline-none focus:ring-2"
                style={{
                  borderColor: selectedTemplateId === t.id ? 'var(--accent-primary)' : 'var(--border-opacity-20)',
                  padding: 0,
                  background: 'var(--bg-opacity-5)',
                }}
                aria-label={`Use template ${t.name}`}
              >
                <div className="aspect-square w-full flex items-center justify-center" style={{ background: 'var(--bg-opacity-10)' }}>
                  {t.thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={t.thumbnail}
                      alt=""
                      className="w-full h-full object-cover"
                      width={100}
                      height={100}
                    />
                  ) : (
                    <span className="text-2xl font-bold" style={{ color: 'var(--text-opacity-50)' }}>{t.name[0]}</span>
                  )}
                </div>
                <div className="p-1.5 text-left">
                  <span className="text-xs truncate block" style={{ color: 'var(--text-opacity-90)' }}>
                    {t.name}
                  </span>
                </div>
                <span className="text-xs block p-1.5" style={{ color: 'var(--text-opacity-60)' }}>
                  Use this
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* Input section */}
        <section className="card section-spacing" style={{ padding: CARD_PADDING, marginTop: SECTION_GAP }}>
          <h2 className="section-title mb-4">Create meme</h2>
          <div className="flex flex-col gap-4">
            <label className="block">
              <span className="block text-sm mb-1" style={{ color: 'var(--text-opacity-70)' }}>
                Meme idea / caption
              </span>
              <input
                type="text"
                className="input w-full"
                placeholder="e.g. Crypto trader checking portfolio at 3am"
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                style={{ padding: 'var(--space-3)' }}
              />
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="block">
                <span className="block text-sm mb-1" style={{ color: 'var(--text-opacity-70)' }}>
                  Top text
                </span>
                <input
                  type="text"
                  className="input w-full"
                  placeholder="Optional"
                  value={topText}
                  onChange={(e) => setTopText(e.target.value)}
                  style={{ padding: 'var(--space-3)' }}
                />
              </label>
              <label className="block">
                <span className="block text-sm mb-1" style={{ color: 'var(--text-opacity-70)' }}>
                  Bottom text
                </span>
                <input
                  type="text"
                  className="input w-full"
                  placeholder="Optional"
                  value={bottomText}
                  onChange={(e) => setBottomText(e.target.value)}
                  style={{ padding: 'var(--space-3)' }}
                />
              </label>
            </div>
            <div className="flex flex-wrap gap-4">
              <label className="block">
                <span className="block text-sm mb-1" style={{ color: 'var(--text-opacity-70)' }}>
                  Style
                </span>
                <select
                  className="input"
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                  style={{ padding: 'var(--space-3)', minWidth: 120 }}
                >
                  {(styles.length ? styles : MEME_STYLES).map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="block text-sm mb-1" style={{ color: 'var(--text-opacity-70)' }}>
                  Format
                </span>
                <select
                  className="input"
                  value={format}
                  onChange={(e) => setFormat(e.target.value as MemeFormat)}
                  style={{ padding: 'var(--space-3)', minWidth: 100 }}
                >
                  <option value="image">Image</option>
                  <option value="gif">GIF</option>
                  <option value="video">Video</option>
                </select>
              </label>
              {format === 'image' && (
                <>
                  <label className="block">
                    <span className="block text-sm mb-1" style={{ color: 'var(--text-opacity-70)' }}>
                      Image provider
                    </span>
                    <select
                      className="input"
                      value={imageProvider}
                      onChange={(e) => setImageProvider(e.target.value as 'gemini' | 'reve')}
                      style={{ padding: 'var(--space-3)', minWidth: 140 }}
                    >
                      {(providers.length ? providers : [{ value: 'gemini', label: 'Gemini (Flash 2.5 / Pro)' }, { value: 'reve', label: 'Reve AI' }]).map((p) => (
                        <option key={p.value} value={p.value}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  {imageProvider === 'gemini' && (
                    <label className="block">
                      <span className="block text-sm mb-1" style={{ color: 'var(--text-opacity-70)' }}>
                        Gemini model
                      </span>
                      <select
                        className="input"
                        value={geminiModel}
                        onChange={(e) => setGeminiModel(e.target.value as 'flash' | 'pro')}
                        style={{ padding: 'var(--space-3)', minWidth: 120 }}
                      >
                        <option value="flash">Flash 2.5</option>
                        <option value="pro">Pro</option>
                      </select>
                    </label>
                  )}
                </>
              )}
            </div>

            {/* Reference media */}
            <div className="border rounded-xl p-4" style={{ borderColor: 'var(--border-opacity-15)' }}>
              <span className="section-title text-sm block mb-2">Reference (optional)</span>
              <p className="text-sm mb-3" style={{ color: 'var(--text-opacity-60)' }}>
                Upload or paste a URL to use as style/content reference.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <label className="btn-secondary cursor-pointer flex items-center gap-2" style={{ padding: 'var(--space-2) var(--space-3)' }}>
                  <Upload style={{ width: 'var(--icon-md)', height: 'var(--icon-md)' }} />
                  Upload image / GIF / video
                  <input
                    type="file"
                    accept="image/*,video/*"
                    className="hidden"
                    onChange={handleReferenceFile}
                  />
                </label>
                <span style={{ color: 'var(--text-opacity-50)' }}>or</span>
                <input
                  type="url"
                  className="input flex-1"
                  placeholder="Paste reference URL"
                  value={referenceUrl}
                  onChange={(e) => {
                    setReferenceUrl(e.target.value);
                    if (e.target.value) {
                      setReferencePreview(e.target.value);
                      setReferenceFile(null);
                    } else setReferencePreview(null);
                  }}
                  style={{ padding: 'var(--space-2) var(--space-3)', minWidth: 180 }}
                />
                {(referencePreview || referenceFile) && (
                  <button
                    type="button"
                    onClick={clearReference}
                    className="p-2 rounded-lg nav-link"
                    aria-label="Clear reference"
                  >
                    <X style={{ width: 'var(--icon-md)', height: 'var(--icon-md)' }} />
                  </button>
                )}
              </div>
              {referencePreview && (
                <div className="mt-3 rounded-lg overflow-hidden inline-block max-w-[200px] max-h-[120px]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={referencePreview}
                    alt="Reference preview"
                    className="max-w-full max-h-[120px] object-contain"
                  />
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Preview / Generation */}
        <section className="card section-spacing" style={{ padding: CARD_PADDING, marginTop: SECTION_GAP }}>
          <h2 className="section-title mb-4">Preview</h2>
          {loading && (
            <div className="flex flex-col items-center justify-center py-16" style={{ gap: 'var(--space-4)' }}>
              <Loader2 className="animate-spin" style={{ width: 48, height: 48, color: 'var(--text-opacity-70)' }} />
              <p style={{ color: 'var(--text-opacity-70)' }}>Generating your crypto meme…</p>
            </div>
          )}
          {error && (
            <div
              className="rounded-xl p-4 mb-4"
              style={{ background: 'var(--color-error-bg)', border: '1px solid var(--color-error)', color: 'var(--color-error)' }}
            >
              {error}
            </div>
          )}
          {!loading && generatedUrl && resolvedUrl && (
            <>
              <div className="relative inline-block rounded-xl overflow-hidden border" style={{ borderColor: 'var(--border-opacity-20)' }}>
                {generatedFormat === 'video' && (
                  <video
                    src={resolvedUrl}
                    controls
                    loop
                    playsInline
                    className="block max-w-full h-auto"
                    style={{ maxWidth: '100%' }}
                  />
                )}
                {generatedFormat === 'gif' && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={resolvedUrl}
                    alt="Generated meme GIF"
                    className="block max-w-full h-auto"
                    style={{ maxWidth: '100%' }}
                  />
                )}
                {generatedFormat === 'image' && (
                  <>
                    <img
                      ref={imgRef}
                      src={resolvedUrl}
                      alt=""
                      aria-hidden
                      className="absolute opacity-0 w-full h-full pointer-events-none"
                      style={{ maxWidth: '100%' }}
                      crossOrigin="anonymous"
                      onLoad={drawOverlay}
                    />
                    <canvas
                      ref={canvasRef}
                      className="block max-w-full h-auto"
                      style={{ display: 'block' }}
                    />
                  </>
                )}
              </div>
              {generatedFormat === 'image' && (
                <div className="mt-4 flex flex-wrap items-center gap-4">
                  <span className="text-sm" style={{ color: 'var(--text-opacity-70)' }}>Text overlay:</span>
                  <label className="flex items-center gap-2">
                    <span className="text-sm" style={{ color: 'var(--text-opacity-60)' }}>Size</span>
                    <input
                      type="range"
                      min="12"
                      max="72"
                      value={overlayFontSize}
                      onChange={(e) => setOverlayFontSize(Number(e.target.value))}
                    />
                    <span className="text-xs" style={{ color: 'var(--text-opacity-60)' }}>{overlayFontSize}</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <span className="text-sm" style={{ color: 'var(--text-opacity-60)' }}>Color</span>
                    <input
                      type="color"
                      value={overlayColor}
                      onChange={(e) => setOverlayColor(e.target.value)}
                      className="w-8 h-8 rounded cursor-pointer"
                    />
                  </label>
                </div>
              )}
            </>
          )}
          {!loading && !generatedUrl && !error && (
            <p className="py-8 text-center" style={{ color: 'var(--text-opacity-50)' }}>
              Enter an idea and click Generate.
            </p>
          )}
        </section>

        {/* Controls */}
        <section className="flex flex-wrap gap-3 section-spacing" style={{ marginTop: SECTION_GAP }}>
          <button
            type="button"
            onClick={generate}
            disabled={loading || !idea.trim()}
            className="btn-primary flex items-center gap-2"
            style={{ padding: 'var(--space-3) var(--space-5)' }}
          >
            {loading ? (
              <Loader2 className="animate-spin" style={{ width: 'var(--icon-md)', height: 'var(--icon-md)' }} />
            ) : (
              <ImageIcon style={{ width: 'var(--icon-md)', height: 'var(--icon-md)' }} />
            )}
            Generate
          </button>
          {generatedUrl && (
            <>
              <button
                type="button"
                onClick={download}
                className="btn-secondary flex items-center gap-2"
                style={{ padding: 'var(--space-3) var(--space-5)' }}
              >
                <Download style={{ width: 'var(--icon-md)', height: 'var(--icon-md)' }} />
                Download
              </button>
              <button
                type="button"
                onClick={generate}
                disabled={loading}
                className="btn-secondary flex items-center gap-2"
                style={{ padding: 'var(--space-3) var(--space-5)' }}
              >
                <RefreshCw style={{ width: 'var(--icon-md)', height: 'var(--icon-md)' }} />
                Regenerate
              </button>
            </>
          )}
        </section>
      </div>
    </AppLayout>
  );
}

function wrapStroke(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number
) {
  const words = text.split(' ');
  let line = '';
  const lineHeight = ctx.measureText('M').actualBoundingBoxAscent * 1.2;
  let currentY = y;
  for (let i = 0; i < words.length; i++) {
    const test = line + (line ? ' ' : '') + words[i];
    const m = ctx.measureText(test);
    if (m.width > maxWidth && line) {
      ctx.strokeText(line, x, currentY);
      ctx.fillText(line, x, currentY);
      line = words[i];
      currentY += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) {
    ctx.strokeText(line, x, currentY);
    ctx.fillText(line, x, currentY);
  }
}
