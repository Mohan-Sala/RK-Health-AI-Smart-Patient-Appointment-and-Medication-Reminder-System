import { useEffect, useMemo, useState } from "react";
import { Modal, Field, ModalFooter, inputCls, textareaCls } from "./Modal";
import { type User } from "@/lib/store";

const bloodGroupOptions = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;
const lifestyleOptions = ["Active", "Moderately Active", "Sedentary", "Athlete", "Other"] as const;

type ProfileFormState = {
  name: string;
  email: string;
  phone: string;
  dob: string;
  gender: string;
  avatar: string;
  bloodGroup: string;
  height: string;
  weight: string;
  bmi: string;
  allergies: string;
  medicalConditions: string;
  insurance: string;
  lifestyle: string;
  specialization?: string;
  hospital?: string;
  availability?: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  user: User | null;
  onSave: (data: ProfileFormState) => Promise<void> | void;
};

function toInputValue(value?: string | null) {
  return value ?? "";
}

function calculateBmi(height: string, weight: string) {
  const heightValue = Number(height);
  const weightValue = Number(weight);

  if (!Number.isFinite(heightValue) || !Number.isFinite(weightValue) || heightValue <= 0 || weightValue <= 0) {
    return "";
  }

  const bmi = weightValue / ((heightValue / 100) * (heightValue / 100));
  return Number.isFinite(bmi) ? bmi.toFixed(1) : "";
}

export function ProfileModal({ open, onClose, user, onSave }: Props) {
  const [form, setForm] = useState<ProfileFormState>({
    name: "",
    email: "",
    phone: "",
    dob: "",
    gender: "",
    avatar: "",
    bloodGroup: "",
    height: "",
    weight: "",
    bmi: "",
    allergies: "",
    medicalConditions: "",
    insurance: "",
    lifestyle: "",
    specialization: "",
    hospital: "",
    availability: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof ProfileFormState, string>>>({});

  useEffect(() => {
    if (!open || !user) return;

    setForm({
      name: toInputValue(user.name),
      email: toInputValue(user.email),
      phone: toInputValue(user.phone),
      dob: toInputValue(user.dob),
      gender: toInputValue(user.gender),
      avatar: toInputValue(user.avatar),
      bloodGroup: toInputValue(user.bloodGroup),
      height: toInputValue(user.height),
      weight: toInputValue(user.weight),
      bmi: toInputValue(user.bmi),
      allergies: toInputValue(user.allergies),
      medicalConditions: toInputValue(user.medicalConditions),
      insurance: toInputValue(user.insurance),
      lifestyle: toInputValue(user.lifestyle),
      specialization: toInputValue(user.specialization),
      hospital: toInputValue(user.hospital),
      availability: toInputValue(user.availability),
    });
    setErrors({});
  }, [open, user]);

  const derivedBmi = useMemo(() => calculateBmi(form.height, form.weight), [form.height, form.weight]);

  useEffect(() => {
    setForm((prev) => ({ ...prev, bmi: derivedBmi }));
  }, [derivedBmi]);

  const setField = <K extends keyof ProfileFormState>(key: K, value: ProfileFormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const validate = () => {
    const nextErrors: Partial<Record<keyof ProfileFormState, string>> = {};

    if (!form.name.trim()) nextErrors.name = "Name is required";
    if (!form.email.trim()) nextErrors.email = "Email is required";

    if (form.bloodGroup && !bloodGroupOptions.includes(form.bloodGroup as typeof bloodGroupOptions[number])) {
      nextErrors.bloodGroup = "Select a valid blood group";
    }

    if (form.height) {
      const heightValue = Number(form.height);
      if (!Number.isFinite(heightValue) || heightValue < 50 || heightValue > 250) {
        nextErrors.height = "Height must be between 50 and 250 cm";
      }
    }

    if (form.weight) {
      const weightValue = Number(form.weight);
      if (!Number.isFinite(weightValue) || weightValue < 10 || weightValue > 300) {
        nextErrors.weight = "Weight must be between 10 and 300 kg";
      }
    }

    if (form.insurance && form.insurance.length > 100) {
      nextErrors.insurance = "Insurance must be 100 characters or less";
    }

    if (form.lifestyle && !lifestyleOptions.includes(form.lifestyle as typeof lifestyleOptions[number])) {
      nextErrors.lifestyle = "Select a valid lifestyle option";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const submit = async () => {
    if (!validate()) return;

    await onSave({
      ...form,
      bmi: derivedBmi,
      bloodGroup: form.bloodGroup || "",
      height: form.height,
      weight: form.weight,
      allergies: form.allergies,
      medicalConditions: form.medicalConditions,
      insurance: form.insurance,
      lifestyle: form.lifestyle,
      specialization: form.specialization,
      hospital: form.hospital,
      availability: form.availability,
    });
    onClose();
  };

  const toNumberValue = (value: string) => value;

  return (
    <Modal open={open} onClose={onClose} title="Edit Profile" maxWidth="max-w-4xl">
      <div className="px-6 py-5 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Full Name" required error={errors.name}>
            <input className={inputCls} value={form.name} onChange={(e) => setField("name", e.target.value)} />
          </Field>
          <Field label="Email Address" required error={errors.email}>
            <input className={inputCls} type="email" value={form.email} readOnly />
          </Field>
          <Field label="Phone Number">
            <input className={inputCls} value={form.phone} onChange={(e) => setField("phone", e.target.value)} />
          </Field>
          <Field label="Date of Birth">
            <input className={inputCls} type="date" value={form.dob} onChange={(e) => setField("dob", e.target.value)} />
          </Field>
          <Field label="Gender">
            <select className={inputCls} value={form.gender} onChange={(e) => setField("gender", e.target.value)}>
              <option value="">Select gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </Field>
          <Field label="Avatar URL">
            <input className={inputCls} value={form.avatar} onChange={(e) => setField("avatar", e.target.value)} />
          </Field>
        </div>

        <div>
          <h3 className="text-[15px] font-semibold mb-4">Health Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Blood Group" error={errors.bloodGroup}>
              <select className={inputCls} value={form.bloodGroup} onChange={(e) => setField("bloodGroup", e.target.value)}>
                <option value="">Not Provided</option>
                {bloodGroupOptions.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </Field>
            <Field label="Lifestyle" error={errors.lifestyle}>
              <select className={inputCls} value={form.lifestyle} onChange={(e) => setField("lifestyle", e.target.value)}>
                <option value="">Not Provided</option>
                {lifestyleOptions.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </Field>
            <Field label="Height (cm)" error={errors.height}>
              <input
                className={inputCls}
                type="number"
                min={50}
                max={250}
                value={toNumberValue(form.height)}
                onChange={(e) => setField("height", e.target.value)}
                placeholder="Not Provided"
              />
            </Field>
            <Field label="Weight (kg)" error={errors.weight}>
              <input
                className={inputCls}
                type="number"
                min={10}
                max={300}
                value={toNumberValue(form.weight)}
                onChange={(e) => setField("weight", e.target.value)}
                placeholder="Not Provided"
              />
            </Field>
            <Field label="BMI">
              <input className={inputCls} value={form.bmi || ""} readOnly placeholder="Auto-calculated" />
            </Field>
            <Field label="Insurance" error={errors.insurance}>
              <input className={inputCls} value={form.insurance} maxLength={100} onChange={(e) => setField("insurance", e.target.value)} placeholder="Not Provided" />
            </Field>
            <Field label="Allergies" className="md:col-span-2">
              <textarea
                rows={3}
                className={textareaCls}
                value={form.allergies}
                onChange={(e) => setField("allergies", e.target.value)}
                placeholder="Not Provided"
              />
            </Field>
            <Field label="Medical Conditions" className="md:col-span-2">
              <textarea
                rows={3}
                className={textareaCls}
                value={form.medicalConditions}
                onChange={(e) => setField("medicalConditions", e.target.value)}
                placeholder="Not Provided"
              />
            </Field>
          </div>
        </div>
      </div>
      <ModalFooter>
        <button onClick={onClose} className="h-10 px-5 rounded-xl border border-border text-[13.5px] hover:bg-hover transition">Cancel</button>
        <button onClick={submit} className="h-10 px-5 rounded-xl bg-primary text-primary-foreground text-[13.5px] font-medium hover:opacity-90 transition">Save Changes</button>
      </ModalFooter>
    </Modal>
  );
}
