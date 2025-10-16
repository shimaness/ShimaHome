"use client";

import { useEffect, useMemo, useState } from "react";

type Submission = { id: string; name: string; status: string };

export default function LandlordOnboardingPage() {
  const [step, setStep] = useState<number>(1);

  // Step 1: Profile
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [residenceArea, setResidenceArea] = useState("");

  // Step 2: Verification
  const [verifyType, setVerifyType] = useState<"PHONE" | "EMAIL">("PHONE");
  const [destination, setDestination] = useState("");
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState("");
  const [verified, setVerified] = useState(false);

  // Step 3: Ownership document
  const [ownershipFile, setOwnershipFile] = useState<File | null>(null);
  const [ownershipUploaded, setOwnershipUploaded] = useState(false);

  // Step 4: Property submission
  const [subName, setSubName] = useState("");
  const [subDesc, setSubDesc] = useState("");
  const [address, setAddress] = useState("");
  const [lat, setLat] = useState<string>("");
  const [lng, setLng] = useState<string>("");
  const [createdSubmission, setCreatedSubmission] = useState<Submission | null>(null);

  // Step 5: Photos
  const [photos, setPhotos] = useState<FileList | null>(null);
  const [uploadedCount, setUploadedCount] = useState(0);
  const canSubmit = useMemo(() => !!createdSubmission && uploadedCount > 0, [createdSubmission, uploadedCount]);

  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  function setNotice(ok: boolean, text: string) {
    if (ok) {
      setMsg(text);
      setErr(null);
    } else {
      setErr(text);
      setMsg(null);
    }
  }

  async function postJSON(url: string, body: any) {
    const res = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message || data?.error || "Request failed");
    return data;
  }

  async function step1SaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await postJSON("/api/landlord/profile", { fullName, phone, idNumber, residenceArea });
      setNotice(true, "Profile saved.");
      setStep(2);
    } catch (e: any) {
      setNotice(false, e.message);
    } finally {
      setBusy(false);
    }
  }

  async function step2SendCode(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await postJSON("/api/landlord/verify/request", { type: verifyType, destination: destination || undefined });
      setSent(true);
      setNotice(true, "Verification code sent.");
    } catch (e: any) {
      setNotice(false, e.message);
    } finally {
      setBusy(false);
    }
  }

  async function step2Confirm(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await postJSON("/api/landlord/verify/confirm", { type: verifyType, code });
      setVerified(true);
      setNotice(true, "Verified successfully.");
      setStep(3);
    } catch (e: any) {
      setNotice(false, e.message);
    } finally {
      setBusy(false);
    }
  }

  async function step3UploadOwnership(e: React.FormEvent) {
    e.preventDefault();
    if (!ownershipFile) {
      setNotice(false, "Please choose a file.");
      return;
    }
    setBusy(true);
    try {
      const form = new FormData();
      form.set("kind", "OWNERSHIP_DOC");
      form.set("file", ownershipFile);
      const res = await fetch("/api/kyc/docs/upload", { method: "POST", body: form });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || data?.error || "Upload failed");
      setOwnershipUploaded(true);
      setNotice(true, "Ownership document uploaded.");
      setStep(4);
    } catch (e: any) {
      setNotice(false, e.message);
    } finally {
      setBusy(false);
    }
  }

  async function step4CreateSubmission(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const payload: any = { name: subName, description: subDesc, address };
      const latNum = Number(lat), lngNum = Number(lng);
      if (!Number.isNaN(latNum) && !Number.isNaN(lngNum)) {
        payload.lat = latNum;
        payload.lng = lngNum;
      }
      const data = await postJSON("/api/landlord/submissions", payload);
      setCreatedSubmission({ id: data?.id, name: data?.name, status: data?.status });
      setNotice(true, "Submission created.");
      setStep(5);
    } catch (e: any) {
      setNotice(false, e.message);
    } finally {
      setBusy(false);
    }
  }

  async function step5UploadPhotos(e: React.FormEvent) {
    e.preventDefault();
    if (!createdSubmission) return;
    if (!photos || photos.length === 0) {
      setNotice(false, "Please choose at least one photo.");
      return;
    }
    setBusy(true);
    try {
      let okCount = 0;
      for (const f of Array.from(photos)) {
        const form = new FormData();
        form.set("submissionId", createdSubmission.id);
        form.set("file", f);
        const res = await fetch("/api/landlord/photos/upload", { method: "POST", body: form });
        if (res.ok) okCount += 1;
      }
      setUploadedCount((c) => c + okCount);
      setNotice(true, `${okCount} photo(s) uploaded.`);
    } catch (e: any) {
      setNotice(false, e.message);
    } finally {
      setBusy(false);
    }
  }

  async function finalizeSubmit() {
    if (!createdSubmission) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/landlord/submissions/${createdSubmission.id}/submit`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || data?.error || "Submit failed");
      setNotice(true, "Submitted for review.");
      setStep(6);
    } catch (e: any) {
      setNotice(false, e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container mx-auto max-w-3xl py-8">
      <h1 className="mb-2 text-2xl font-semibold">Landlord Onboarding</h1>
      <p className="mb-6 text-slate-600">Complete the steps to register your landlord account and submit your property for review.</p>

      {msg && <div className="mb-4 rounded border border-green-200 bg-green-50 px-3 py-2 text-green-700">{msg}</div>}
      {err && <div className="mb-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-red-700">{err}</div>}

      <ol className="mb-6 flex flex-wrap gap-2 text-sm">
        <li className={`rounded px-2 py-1 ${step >= 1 ? "bg-slate-900 text-white" : "bg-slate-100"}`}>1. Profile</li>
        <li className={`rounded px-2 py-1 ${step >= 2 ? "bg-slate-900 text-white" : "bg-slate-100"}`}>2. Verify</li>
        <li className={`rounded px-2 py-1 ${step >= 3 ? "bg-slate-900 text-white" : "bg-slate-100"}`}>3. Ownership Doc</li>
        <li className={`rounded px-2 py-1 ${step >= 4 ? "bg-slate-900 text-white" : "bg-slate-100"}`}>4. Property</li>
        <li className={`rounded px-2 py-1 ${step >= 5 ? "bg-slate-900 text-white" : "bg-slate-100"}`}>5. Photos</li>
        <li className={`rounded px-2 py-1 ${step >= 6 ? "bg-slate-900 text-white" : "bg-slate-100"}`}>6. Submit</li>
      </ol>

      {step === 1 && (
        <form onSubmit={step1SaveProfile} className="grid gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Full name</label>
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-1 w-full rounded border border-slate-300 px-3 py-2" required />
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700">Phone</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1 w-full rounded border border-slate-300 px-3 py-2" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">ID number</label>
              <input value={idNumber} onChange={(e) => setIdNumber(e.target.value)} className="mt-1 w-full rounded border border-slate-300 px-3 py-2" required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Area of residence</label>
            <input value={residenceArea} onChange={(e) => setResidenceArea(e.target.value)} className="mt-1 w-full rounded border border-slate-300 px-3 py-2" required />
          </div>
          <div>
            <button disabled={busy} className="rounded-md bg-slate-900 px-4 py-2 text-white hover:bg-slate-800 disabled:opacity-50">Save and continue</button>
          </div>
        </form>
      )}

      {step === 2 && (
        <div className="grid gap-4">
          <form onSubmit={step2SendCode} className="grid gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700">Verification method</label>
              <select value={verifyType} onChange={(e) => setVerifyType(e.target.value as any)} className="mt-1 w-full rounded border border-slate-300 px-3 py-2">
                <option value="PHONE">Phone</option>
                <option value="EMAIL">Email</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Destination (optional)</label>
              <input placeholder={verifyType === "PHONE" ? "+2547xxxxxxx" : "you@example.com"} value={destination} onChange={(e) => setDestination(e.target.value)} className="mt-1 w-full rounded border border-slate-300 px-3 py-2" />
            </div>
            <button disabled={busy} className="w-fit rounded-md bg-slate-900 px-4 py-2 text-white hover:bg-slate-800 disabled:opacity-50">Send code</button>
          </form>

          {sent && (
            <form onSubmit={step2Confirm} className="grid gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700">Enter code</label>
                <input value={code} onChange={(e) => setCode(e.target.value)} className="mt-1 w-full rounded border border-slate-300 px-3 py-2" />
              </div>
              <button disabled={busy} className="w-fit rounded-md bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-500 disabled:opacity-50">Confirm</button>
            </form>
          )}
        </div>
      )}

      {step === 3 && (
        <form onSubmit={step3UploadOwnership} className="grid gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Upload ownership document (PDF/JPG/PNG)</label>
            <input type="file" accept="image/*,application/pdf" onChange={(e) => setOwnershipFile(e.target.files?.[0] || null)} className="mt-1 w-full" />
          </div>
          <button disabled={busy} className="w-fit rounded-md bg-slate-900 px-4 py-2 text-white hover:bg-slate-800 disabled:opacity-50">Upload and continue</button>
        </form>
      )}

      {step === 4 && (
        <form onSubmit={step4CreateSubmission} className="grid gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Property name</label>
            <input value={subName} onChange={(e) => setSubName(e.target.value)} className="mt-1 w-full rounded border border-slate-300 px-3 py-2" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Description</label>
            <textarea value={subDesc} onChange={(e) => setSubDesc(e.target.value)} className="mt-1 min-h-[100px] w-full rounded border border-slate-300 px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Address</label>
            <input value={address} onChange={(e) => setAddress(e.target.value)} className="mt-1 w-full rounded border border-slate-300 px-3 py-2" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Latitude</label>
              <input value={lat} onChange={(e) => setLat(e.target.value)} className="mt-1 w-full rounded border border-slate-300 px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Longitude</label>
              <input value={lng} onChange={(e) => setLng(e.target.value)} className="mt-1 w-full rounded border border-slate-300 px-3 py-2" />
            </div>
          </div>
          <button disabled={busy} className="w-fit rounded-md bg-slate-900 px-4 py-2 text-white hover:bg-slate-800 disabled:opacity-50">Create submission</button>
        </form>
      )}

      {step === 5 && createdSubmission && (
        <div className="grid gap-4">
          <div className="rounded border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
            <div><span className="font-medium">Submission:</span> {createdSubmission.name}</div>
            <div><span className="font-medium">ID:</span> {createdSubmission.id}</div>
          </div>
          <form onSubmit={step5UploadPhotos} className="grid gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Property photos</label>
              <input type="file" accept="image/*" multiple onChange={(e) => setPhotos(e.target.files)} className="mt-1 w-full" />
              {uploadedCount > 0 && <div className="mt-2 text-sm text-slate-600">Uploaded: {uploadedCount}</div>}
            </div>
            <div className="flex gap-2">
              <button disabled={busy} className="rounded-md bg-slate-900 px-4 py-2 text-white hover:bg-slate-800 disabled:opacity-50" type="submit">Upload photos</button>
              <button type="button" disabled={busy || !canSubmit} className="rounded-md bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-500 disabled:opacity-50" onClick={finalizeSubmit}>Submit for review</button>
            </div>
          </form>
        </div>
      )}

      {step === 6 && (
        <div className="rounded border border-emerald-200 bg-emerald-50 p-4 text-emerald-700">
          Your property has been submitted for review. We will notify you once reviewed by an admin.
        </div>
      )}
    </div>
  );
}
