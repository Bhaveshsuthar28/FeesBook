import {
  Archive,
  Banknote,
  Building2,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  CreditCard,
  FileSignature,
  FileText,
  Image,
  Landmark,
  LoaderCircle,
  Pencil,
  Plus,
  ReceiptText,
  RefreshCw,
  Save,
  Stamp,
  Upload,
  Users,
  WalletCards,
} from "lucide-react";

import Receipt from "../../assest/feesRecipt.png"

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  CitySelect,
  StateSelect,
} from "react-country-state-city";

import "react-country-state-city/dist/react-country-state-city.css";

import {
  getImageKitAuth,
} from "../lib/api/studentapi.js";

import {
  allocateClassFees,
  archiveClassFee,
  assignFeeToClass,
  createFeeType,
  getFeeStructure,
  updateClassFee,
} from "../lib/api/feesapi.js";

import {
  archiveAcademicYear,
  createAcademicYear,
  getAcademicYears,
  getSchoolProfile,
  getSettingsPreferences,
  setActiveAcademicYear,
  updateSettingsPreferences,
  updateSchoolProfile,
} from "../lib/api/settingsapi.js";

import {
  checkerStyle,
  cleanImageBackground,
} from "../lib/imageCleanup.js";

import {
  notify,
} from "../lib/toast.js";

import {
  SettingsPageSkeleton,
} from "../components/skeleton/PageSkeletons.jsx";

const emptyProfile = {
  schoolName: "",
  address: "",
  city: "",
  state: "",
  district: "",
  pinCode: "",
  mobile: "",
  logoUrl: "",
  logoFileId: "",
  principalSignatureUrl: "",
  principalSignatureFileId: "",
  stampUrl: "",
  latitude: null,
  longitude: null,
};

const emptyFeeType = {
  name: "",
  defaultAmount: "",
  frequency: "Yearly",
  isOptional: false,
};

const emptyClassFee = {
  feeTypeId: "",
  amount: "",
  isDefault: true,
};

const academicYearPattern =
  /^\d{4}-\d{4}$/;

const settingsTabs = [
  {
    id: "profile",
    label: "School Profile",
    icon: Building2,
  },
  {
    id: "academic",
    label: "Academic Year",
    icon: CalendarDays,
  },
  {
    id: "fees",
    label: "Fee Structure",
    icon: WalletCards,
  },
  {
    id: "receipt",
    label: "Receipt Settings",
    icon: ReceiptText,
  },
  {
    id: "payments",
    label: "Payment Modes",
    icon: CreditCard,
  },
];

const paymentModes = [
  {
    name: "Cash",
    icon: Banknote,
    color:
      "bg-emerald-50 text-emerald-700 border-emerald-100",
  },
  {
    name: "UPI",
    icon: WalletCards,
    color:
      "bg-indigo-50 text-indigo-700 border-indigo-100",
  },
  {
    name: "Card",
    icon: CreditCard,
    color:
      "bg-violet-50 text-violet-700 border-violet-100",
  },
  {
    name: "Bank Transfer",
    icon: Landmark,
    color:
      "bg-blue-50 text-blue-700 border-blue-100",
  },
  {
    name: "Cheque",
    icon: FileText,
    color:
      "bg-orange-50 text-orange-700 border-orange-100",
  },
];

const formatCurrency =
  (amount) =>
    `Rs ${Number(amount || 0).toLocaleString("en-IN")}`;

const inputClassName =
  "h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 disabled:cursor-not-allowed disabled:opacity-60";

const textareaClassName =
  "min-h-28 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-bold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 disabled:cursor-not-allowed disabled:opacity-60";

function Field({
  label,
  children,
}) {
  return (
    <label className="space-y-2">
      <span className="text-xs font-extrabold text-slate-600">
        {label}
      </span>
      {children}
    </label>
  );
}

function SectionCard({
  eyebrow,
  title,
  action,
  children,
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          {eyebrow && (
            <p className="text-xs font-extrabold uppercase text-indigo-600">
              {eyebrow}
            </p>
          )}
          <h2 className="mt-1 text-lg font-extrabold text-slate-950 sm:text-xl">
            {title}
          </h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function UploadPanel({
  title,
  subtitle,
  imageUrl,
  uploading,
  checker,
  icon,
  onUpload,
}) {
  const UploadIcon =
    icon;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <UploadIcon size={20} />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-extrabold text-slate-950">
              {title}
            </p>
            <p className="mt-1 text-xs font-semibold text-slate-500">
              {subtitle}
            </p>
          </div>
        </div>
        <ChevronDown
          size={16}
          className="text-slate-400 sm:hidden"
        />
      </div>

      <div
        className="mt-4 flex h-32 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50"
        style={checker ? checkerStyle : undefined}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className="max-h-24 max-w-full object-contain"
          />
        ) : (
          <div className="text-center">
            <UploadIcon className="mx-auto text-slate-300" />
            <p className="mt-2 text-xs font-bold text-slate-400">
              Drag, drop or upload
            </p>
          </div>
        )}
      </div>

      <label className="mt-4 flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-indigo-100 bg-indigo-50 text-sm font-extrabold text-indigo-700">
        {uploading ? (
          <LoaderCircle
            size={17}
            className="animate-spin"
          />
        ) : (
          <Upload size={17} />
        )}
        Upload
        <input
          hidden
          type="file"
          accept="image/*"
          onChange={(event) =>
            onUpload(
              event.target.files?.[0]
            )
          }
        />
      </label>
    </div>
  );
}

function StatusToggle({
  enabled,
}) {
  return (
    <span className={`flex h-6 w-11 items-center rounded-full p-1 transition ${
      enabled
        ? "bg-indigo-600"
        : "bg-slate-200"
    }`}>
      <span className={`h-4 w-4 rounded-full bg-white shadow transition ${
        enabled
          ? "translate-x-5"
          : ""
      }`} />
    </span>
  );
}

function ReceiptPreview({
  profile,
  settings,
}) {
  return (
    <div className="w-full space-y-4">
      <div className="mx-auto w-full max-w-sm rounded-xl border-2 border-slate-300 bg-slate-50 p-4 shadow-sm">
        <img
          src={Receipt}
          alt="Receipt Preview"
          className="h-auto w-full rounded-lg object-contain"
        />
      </div>
      <div className="rounded-lg bg-blue-50 p-3 text-center">
        <p className="text-sm font-semibold text-blue-900">
          📋 Receipt Preview
        </p>
        <p className="text-xs text-blue-700 mt-1">
          The actual PDF receipt will be generated and auto-downloaded when a payment is recorded.
        </p>
        <p className="text-xs text-blue-600 mt-2">
          ✓ Includes all student & payment details
        </p>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const [
    activeTab,
    setActiveTab,
  ] = useState("profile");
  const [
    profile,
    setProfile,
  ] = useState(emptyProfile);
  const [
    stateSelection,
    setStateSelection,
  ] = useState(null);
  const [
    citySelection,
    setCitySelection,
  ] = useState(null);
  const [
    structure,
    setStructure,
  ] = useState({
    feeTypes: [],
    classes: [],
  });
  const [
    selectedClassId,
    setSelectedClassId,
  ] = useState("");
  const [
    selectedFeeTypeIds,
    setSelectedFeeTypeIds,
  ] = useState([]);
  const [
    feeTypeForm,
    setFeeTypeForm,
  ] = useState(emptyFeeType);
  const [
    classFeeForm,
    setClassFeeForm,
  ] = useState(emptyClassFee);
  const [
    academicYears,
    setAcademicYears,
  ] = useState({
    activeAcademicYear: "",
    currentAcademicYear: "",
    previousAcademicYear: "",
    years: [],
  });
  const [
    newAcademicYear,
    setNewAcademicYear,
  ] = useState("");
  const [
    creatingYear,
    setCreatingYear,
  ] = useState(false);
  const [
    archivingYear,
    setArchivingYear,
  ] = useState(false);
  const [
    activatingYear,
    setActivatingYear,
  ] = useState(false);
  const [
    receiptSettings,
    setReceiptSettings,
  ] = useState({
    prefix: "FB",
    signature: true,
    stamp: true,
    footer:
      "Thank you for your payment. This is a computer generated receipt.",
  });
  const [
    showReceiptPreview,
    setShowReceiptPreview,
  ] = useState(false);
  const [
    enabledModes,
    setEnabledModes,
  ] = useState([
    "Cash",
    "UPI",
    "Bank Transfer",
  ]);
  const [
    loading,
    setLoading,
  ] = useState(true);
  const [
    savingProfile,
    setSavingProfile,
  ] = useState(false);
  const [
    uploadingLogo,
    setUploadingLogo,
  ] = useState(false);
  const [
    uploadingSignature,
    setUploadingSignature,
  ] = useState(false);
  const [
    uploadingStamp,
    setUploadingStamp,
  ] = useState(false);
  const [
    savingFee,
    setSavingFee,
  ] = useState(false);
  const [
    allocating,
    setAllocating,
  ] = useState(false);
  const [
    savingPreferences,
    setSavingPreferences,
  ] = useState(false);

  const selectedClass =
    useMemo(
      () =>
        structure.classes.find(
          (singleClass) =>
            singleClass.id ===
            selectedClassId
        ) ||
        structure.classes[0] ||
        null,
      [
        selectedClassId,
        structure.classes,
      ]
    );

  const mandatoryFees =
    useMemo(
      () =>
        selectedClass?.fees.filter(
          (fee) =>
            !fee.isOptional
        ) || [],
      [selectedClass]
    );

  const optionalFees =
    useMemo(
      () =>
        selectedClass?.fees.filter(
          (fee) =>
            fee.isOptional
        ) || [],
      [selectedClass]
    );

  const assignedFeeTypeIds =
    useMemo(
      () =>
        new Set(
          selectedClass?.fees.map(
            (fee) =>
              fee.feeTypeId
          ) || []
        ),
      [selectedClass]
    );

  const feeTypeIdsOnOtherClasses =
    useMemo(() => {
      const ids =
        new Set();

      structure.classes.forEach(
        (singleClass) => {
          if (
            singleClass.id ===
            selectedClass?.id
          ) {
            return;
          }

          singleClass.fees.forEach(
            (fee) => {
              ids.add(
                fee.feeTypeId
              );
            }
          );
        }
      );

      return ids;
    }, [
      structure.classes,
      selectedClass?.id,
    ]);

  const assignableFeeTypes =
    useMemo(
      () =>
        structure.feeTypes.filter(
          (feeType) =>
            !assignedFeeTypeIds.has(
              feeType.id
            ) &&
            !feeTypeIdsOnOtherClasses.has(
              feeType.id
            )
        ),
      [
        structure.feeTypes,
        assignedFeeTypeIds,
        feeTypeIdsOnOtherClasses,
      ]
    );

  const refreshData =
    useCallback(async () => {
      const [
        profileSettled,
        structureSettled,
        academicSettled,
        preferencesSettled,
      ] =
        await Promise.allSettled([
          getSchoolProfile(),
          getFeeStructure(),
          getAcademicYears(),
          getSettingsPreferences(),
        ]);

      if (profileSettled.status === "fulfilled") {
        setProfile({
          ...emptyProfile,
          ...profileSettled.value,
        });
      } else {
        notify.error(
          profileSettled.reason,
          "School profile could not be loaded"
        );
      }

      if (structureSettled.status === "fulfilled") {
        const structureResult =
          structureSettled.value;
        setStructure(
          structureResult || {
            feeTypes: [],
            classes: [],
          }
        );
        if (
          !selectedClassId &&
          structureResult?.classes?.[0]
        ) {
          setSelectedClassId(
            structureResult.classes[0].id
          );
        }
      } else {
        setStructure({
          feeTypes: [],
          classes: [],
        });
        notify.error(
          structureSettled.reason,
          "Fee structure could not be loaded"
        );
      }

      const academicResult =
        academicSettled.status === "fulfilled"
          ? academicSettled.value
          : null;

      if (academicSettled.status === "fulfilled") {
        setAcademicYears(
          academicResult || {
            activeAcademicYear: "",
            currentAcademicYear: "",
            previousAcademicYear: "",
            years: [],
          }
        );
      } else {
        notify.error(
          academicSettled.reason,
          "Academic years could not be loaded"
        );
      }

      if (preferencesSettled.status === "fulfilled") {
        const preferencesResult =
          preferencesSettled.value;
        setReceiptSettings(
          preferencesResult?.receipt || {
            prefix: "FB",
            signature: true,
            stamp: true,
            footer:
              "Thank you for your payment. This is a computer generated receipt.",
          }
        );
        setEnabledModes(
          preferencesResult?.paymentModes?.length
            ? preferencesResult.paymentModes
            : [
                "Cash",
                "UPI",
                "Bank Transfer",
              ]
        );
      } else {
        notify.error(
          preferencesSettled.reason,
          "Preferences could not be loaded"
        );
      }

      setNewAcademicYear((current) => {
        if (current) {
          return current;
        }

        const active =
          academicResult?.activeAcademicYear ||
          "";
        const startYear =
          Number(
            active.split("-")[0]
          );

        return Number.isFinite(startYear)
          ? `${startYear + 1}-${startYear + 2}`
          : "";
      });
    }, [selectedClassId]);

  useEffect(() => {
    const load =
      async () => {
        try {
          setLoading(true);
          await refreshData();
        } catch (apiError) {
          notify.error(
            apiError,
            "Settings could not be loaded"
          );
        } finally {
          setLoading(false);
        }
      };

    load();
  }, [refreshData]);

  useEffect(() => {
    if (!selectedClass) {
      setSelectedFeeTypeIds([]);
      return;
    }

    setSelectedFeeTypeIds(
      selectedClass.fees
        .filter(
          (fee) =>
            fee.isDefault
        )
        .map(
          (fee) =>
            fee.feeTypeId
        )
    );
  }, [selectedClass]);

  useEffect(() => {
    setClassFeeForm((current) => {
      if (
        !current.feeTypeId ||
        assignableFeeTypes.some(
          (feeType) =>
            feeType.id ===
            current.feeTypeId
        )
      ) {
        return current;
      }

      return emptyClassFee;
    });
  }, [
    selectedClassId,
    assignableFeeTypes,
  ]);

  const updateProfileField =
    (field, value) => {
      setProfile((current) => ({
        ...current,
        [field]: value,
      }));
    };

  const uploadToImageKit =
    async ({
      file,
      folder,
      cleanup = false,
    }) => {
      const uploadFile =
        cleanup
          ? await cleanImageBackground(
              file
            )
          : file;
      const auth =
        await getImageKitAuth();
      const body =
        new FormData();

      body.append(
        "file",
        uploadFile
      );
      body.append(
        "fileName",
        uploadFile.name
      );
      body.append(
        "publicKey",
        auth.publicKey
      );
      body.append(
        "signature",
        auth.signature
      );
      body.append(
        "expire",
        auth.expire
      );
      body.append(
        "token",
        auth.token
      );
      body.append(
        "folder",
        folder
      );

      const response =
        await fetch(
          "https://upload.imagekit.io/api/v1/files/upload",
          {
            method: "POST",
            body,
          }
        );

      if (!response.ok) {
        throw new Error(
          "Image upload failed"
        );
      }

      return response.json();
    };

  const handleImageUpload =
    async ({
      file,
      type,
    }) => {
      if (!file) {
        return;
      }

      const config = {
        logo: {
          folder:
            "/feesbook/school-logo",
          loading:
            setUploadingLogo,
          cleanup: true,
          fields: {
            url:
              "logoUrl",
            id:
              "logoFileId",
          },
        },
        signature: {
          folder:
            "/feesbook/signatures",
          loading:
            setUploadingSignature,
          cleanup: true,
          fields: {
            url:
              "principalSignatureUrl",
            id:
              "principalSignatureFileId",
          },
        },
        stamp: {
          folder:
            "/feesbook/stamps",
          loading:
            setUploadingStamp,
          cleanup: true,
          fields: {
            url:
              "stampUrl",
            id:
              "stampFileId",
          },
        },
      }[type];

      try {
        config.loading(true);
        const uploaded =
          await uploadToImageKit({
            file,
            folder:
              config.folder,
            cleanup:
              config.cleanup,
          });

        setProfile((current) => ({
          ...current,
          [config.fields.url]:
            uploaded.url || "",
          ...(config.fields.id
            ? {
                [config.fields.id]:
                  uploaded.fileId || "",
              }
            : {}),
        }));
      } catch (apiError) {
        notify.error(
          apiError,
          "Image could not be uploaded"
        );
      } finally {
        config.loading(false);
      }
    };

  const saveProfile =
    async () => {
      try {
        setSavingProfile(true);
                const result =
          await updateSchoolProfile({
            schoolName:
              profile.schoolName,
            address:
              profile.address || null,
            city:
              profile.city || null,
            state:
              profile.state || null,
            district:
              profile.district || null,
            pinCode:
              profile.pinCode || null,
            mobile:
              profile.mobile || null,
            logoUrl:
              profile.logoUrl || null,
            logoFileId:
              profile.logoFileId || null,
            principalSignatureUrl:
              profile.principalSignatureUrl ||
              null,
            principalSignatureFileId:
              profile.principalSignatureFileId ||
              null,
          stampUrl:
            profile.stampUrl || null,
          stampFileId:
            profile.stampFileId || null,
          latitude:
            Number.isFinite(
              profile.latitude
            )
              ? profile.latitude
              : null,
          longitude:
            Number.isFinite(
              profile.longitude
            )
              ? profile.longitude
              : null,
        });

        setProfile({
          ...emptyProfile,
          ...result,
        });
        notify.success("School profile saved");
      } catch (apiError) {
        notify.error(apiError, "Profile could not be saved");
      } finally {
        setSavingProfile(false);
      }
    };

  const savePreferences =
    async () => {
      if (enabledModes.length === 0) {
        notify.error(null, "Select at least one payment mode");
        return;
      }

      try {
        setSavingPreferences(true);
                const result =
          await updateSettingsPreferences({
            receipt: {
              prefix:
                receiptSettings.prefix,
              signature:
                Boolean(
                  receiptSettings.signature
                ),
              stamp:
                Boolean(
                  receiptSettings.stamp
                ),
              footer:
                receiptSettings.footer,
            },
            paymentModes:
              enabledModes,
          });

        setReceiptSettings(
          result.receipt
        );
        setEnabledModes(
          result.paymentModes
        );
        notify.success("Settings preferences saved");
      } catch (apiError) {
        notify.error(apiError, "Preferences could not be saved");
      } finally {
        setSavingPreferences(false);
      }
    };

  const addFeeType =
    async () => {
      if (
        !feeTypeForm.name.trim() ||
        Number(feeTypeForm.defaultAmount) <= 0
      ) {
        notify.error(null, "Enter fee name and amount");
        return;
      }

      try {
        setSavingFee(true);
        const createdFeeType =
          await createFeeType({
            name:
              feeTypeForm.name.trim(),
            defaultAmount:
              Number(
                feeTypeForm.defaultAmount
              ),
            frequency:
              feeTypeForm.frequency ||
              "Yearly",
            isOptional:
              Boolean(
                feeTypeForm.isOptional
              ),
          });

        if (selectedClass) {
          await assignFeeToClass({
            classId:
              selectedClass.id,
            feeTypeId:
              createdFeeType.id,
            amount:
              Number(
                feeTypeForm.defaultAmount
              ),
            isDefault:
              !feeTypeForm.isOptional,
          });
        }

        setFeeTypeForm(
          emptyFeeType
        );
        await refreshData();
        notify.success(
          selectedClass
            ? "Fee item created and assigned to this class"
            : "Fee type created"
        );
      } catch (apiError) {
        notify.error(apiError, "Fee type could not be created");
      } finally {
        setSavingFee(false);
      }
    };

  const saveClassFee =
    async () => {
      const feeType =
        structure.feeTypes.find(
          (item) =>
            item.id ===
            classFeeForm.feeTypeId
        );

      if (
        !selectedClass ||
        !feeType
      ) {
        notify.error(null, "Select a class and fee type");
        return;
      }

      const amount =
        Number(
          classFeeForm.amount ||
            feeType.defaultAmount
        );

      if (amount <= 0) {
        notify.error(null, "Enter a valid amount");
        return;
      }

      const existingFee =
        selectedClass.fees.find(
          (fee) =>
            fee.feeTypeId ===
            feeType.id
        );

      try {
        setSavingFee(true);
                if (existingFee) {
          await updateClassFee({
            classFeeId:
              existingFee.classFeeId,
            data: {
              amount,
              isDefault:
                Boolean(
                  classFeeForm.isDefault
                ),
            },
          });
        } else {
          await assignFeeToClass({
            classId:
              selectedClass.id,
            feeTypeId:
              feeType.id,
            amount,
            isDefault:
              Boolean(
                classFeeForm.isDefault
              ),
          });
        }

        setClassFeeForm(
          emptyClassFee
        );
        await refreshData();
        notify.success("Class fee saved");
      } catch (apiError) {
        notify.error(apiError, "Class fee could not be saved");
      } finally {
        setSavingFee(false);
      }
    };

  const toggleAllocationFee =
    (feeTypeId) => {
      setSelectedFeeTypeIds(
        (current) =>
          current.includes(feeTypeId)
            ? current.filter(
                (item) =>
                  item !== feeTypeId
              )
            : [
                ...current,
                feeTypeId,
              ]
      );
    };

  const allocateFees =
    async () => {
      if (
        !selectedClass ||
        selectedFeeTypeIds.length === 0
      ) {
        notify.error(null, "Select at least one fee to allocate");
        return;
      }

      try {
        setAllocating(true);
                const result =
          await allocateClassFees({
            classId:
              selectedClass.id,
            feeTypeIds:
              selectedFeeTypeIds,
          });

        notify.success(
          `Allocated ${result.created} fee rows. Skipped ${result.skipped}.`
        );
      } catch (apiError) {
        notify.error(apiError, "Fees could not be allocated");
      } finally {
        setAllocating(false);
      }
    };

  const createAndPromoteAcademicYear =
    async () => {
      const year =
        newAcademicYear.trim();

      if (!year) {
        notify.error(null, "Enter academic year");
        return;
      }

      if (
        !academicYearPattern.test(
          year
        )
      ) {
        notify.error(
          null,
          "Use format YYYY-YYYY (e.g. 2026-2027)"
        );
        return;
      }

      try {
        setCreatingYear(true);
                const result =
          await createAcademicYear({
            year,
            fromAcademicYear:
              academicYears.activeAcademicYear ||
              academicYears.previousAcademicYear,
            archiveOldYear:
              false,
          });

        setNewAcademicYear("");
        await refreshData();
        notify.success(
          `Created ${result.createdClasses} classes, copied ${result.copiedSections} sections, copied ${result.copiedFees} fee templates, promoted ${result.promotion?.promoted || 0} students.`
        );
      } catch (apiError) {
        notify.error(apiError, "Academic year could not be created");
      } finally {
        setCreatingYear(false);
      }
    };

  const toggleArchiveAcademicYear =
    async (year, archived) => {
      try {
        setArchivingYear(true);
                await archiveAcademicYear({
          year,
          archived,
        });
        await refreshData();
        notify.success(
          archived
            ? "Academic year archived"
            : "Academic year restored"
        );
      } catch (apiError) {
        notify.error(apiError, "Academic year could not be updated");
      } finally {
        setArchivingYear(false);
      }
    };

  const activateAcademicYear =
    async (year) => {
      const normalized =
        String(year || "").trim();

      if (
        !normalized ||
        !academicYearPattern.test(
          normalized
        )
      ) {
        notify.error(
          null,
          "Select a valid academic year"
        );
        return;
      }

      try {
        setActivatingYear(true);
        await setActiveAcademicYear(
          normalized
        );
        await refreshData();
        notify.success("Active academic year updated");
      } catch (apiError) {
        notify.error(apiError, "Active year could not be updated");
      } finally {
        setActivatingYear(false);
      }
    };

  const editClassFee =
    (fee) => {
      setClassFeeForm({
        feeTypeId:
          fee.feeTypeId,
        amount:
          fee.amount,
        isDefault:
          Boolean(fee.isDefault),
      });
    };

  const archiveFeeAssignment =
    async (fee) => {
      if (!fee.classFeeId) {
        return;
      }

      try {
        await archiveClassFee({
          classFeeId:
            fee.classFeeId,
          isArchived: true,
        });
        await refreshData();
        notify.success("Class fee archived");
      } catch (apiError) {
        notify.error(apiError, "Class fee could not be archived");
      }
    };

  const restoreFeeAssignment =
    async (fee) => {
      if (!fee.classFeeId) {
        return;
      }

      try {
        await archiveClassFee({
          classFeeId:
            fee.classFeeId,
          isArchived: false,
        });
        await refreshData();
        notify.success("Class fee restored");
      } catch (apiError) {
        notify.error(apiError, "Class fee could not be restored");
      }
    };

  const renderFeeTable =
    ({
      title,
      fees,
      optional = false,
      archived = false,
    }) => (
      <div className="rounded-2xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <div>
            <h3 className="text-sm font-extrabold text-slate-950">
              {title}
            </h3>
            {optional && (
              <p className="mt-1 text-xs font-semibold text-slate-500">
                Optional fees can be selected during student fee allocation.
              </p>
            )}
          </div>
          {optional && (
            <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-extrabold text-orange-700">
              Checkbox allocation
            </span>
          )}
        </div>
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[560px] text-left">
            <thead className="bg-slate-50 text-xs font-extrabold uppercase text-slate-500">
              <tr>
                {optional && (
                  <th className="px-4 py-3">
                    Allocate
                  </th>
                )}
                <th className="px-4 py-3">Fee Name</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Frequency</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {fees.length === 0 ? (
                <tr>
                  <td
                    colSpan={optional ? 5 : 4}
                    className="px-4 py-10 text-center text-sm font-bold text-slate-500"
                  >
                    No real {optional ? "optional" : "mandatory"} fees assigned to this class yet.
                  </td>
                </tr>
              ) : (
                fees.map((fee) => (
                  <tr
                    key={fee.classFeeId}
                    className="border-b border-slate-100 last:border-b-0"
                  >
                    {optional && (
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedFeeTypeIds.includes(
                            fee.feeTypeId
                          )}
                          onChange={() =>
                            toggleAllocationFee(
                              fee.feeTypeId
                            )
                          }
                        />
                      </td>
                    )}
                    <td className="px-4 py-3 text-sm font-extrabold text-slate-900">
                      {fee.name}
                    </td>
                    <td className="px-4 py-3 text-sm font-extrabold text-slate-700">
                      {formatCurrency(
                        fee.amount
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                        {fee.frequency || "Yearly"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {!archived && (
                          <button
                            type="button"
                            onClick={() =>
                              editClassFee(fee)
                            }
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600"
                            title="Edit"
                          >
                            <Pencil size={14} />
                          </button>
                        )}
                        {archived ? (
                          <button
                            type="button"
                            onClick={() =>
                              restoreFeeAssignment(
                                fee
                              )
                            }
                            className="flex h-8 items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2 text-xs font-extrabold text-emerald-700"
                          >
                            <RefreshCw size={14} />
                            Restore
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              archiveFeeAssignment(
                                fee
                              )
                            }
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-100 text-red-500"
                            title="Archive"
                          >
                            <Archive size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="space-y-2 bg-slate-50 p-3 md:hidden">
          {fees.length === 0 ? (
            <p className="rounded-xl bg-white p-4 text-sm font-bold text-slate-500">
              No real {optional ? "optional" : "mandatory"} fees assigned to this class yet.
            </p>
          ) : fees.map((fee) => (
            <article
              key={fee.classFeeId}
              className="rounded-xl border border-slate-100 bg-white p-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-extrabold text-slate-950">
                    {fee.name}
                  </p>
                  <p className="mt-1 text-xs font-bold text-slate-500">
                    {fee.frequency || "Yearly"}
                  </p>
                </div>
                <p className="text-sm font-extrabold text-indigo-700">
                  {formatCurrency(
                    fee.amount
                  )}
                </p>
              </div>
              {optional && (
                <button
                  type="button"
                  onClick={() =>
                    fee.feeTypeId &&
                    toggleAllocationFee(
                      fee.feeTypeId
                    )
                  }
                  className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-orange-50 text-xs font-extrabold text-orange-700"
                >
                  <Check size={14} />
                  Optional allocation
                </button>
              )}
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() =>
                    editClassFee(fee)
                  }
                  className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 text-xs font-extrabold text-slate-600"
                >
                  <Pencil size={14} />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() =>
                    archiveFeeAssignment(
                      fee
                    )
                  }
                  className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-red-100 text-xs font-extrabold text-red-500"
                >
                  <Archive size={14} />
                  Archive
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    );

  if (loading) {
    return <SettingsPageSkeleton />;
  }

  return (
    <div className="space-y-6 bg-slate-50/40 pb-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-950 sm:text-3xl">
            Settings
          </h1>
          <p className="mt-2 max-w-2xl text-sm font-medium text-slate-500">
            Manage your school profile, fees, academic year and ERP configurations.
          </p>
        </div>
        <button
          type="button"
          onClick={refreshData}
          className="hidden h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-extrabold text-slate-700 shadow-sm sm:flex"
        >
          <RefreshCw size={17} />
          Refresh
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
        {settingsTabs.map((tab) => {
          const TabIcon =
            tab.icon;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() =>
                setActiveTab(tab.id)
              }
              className={`flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl px-4 text-sm font-extrabold transition ${
                activeTab === tab.id
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100"
                  : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              <TabIcon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>
      {activeTab === "profile" && (
        <div className="grid items-start gap-5 xl:grid-cols-[1fr_360px]">
          <SectionCard
            eyebrow="School Profile"
            title="School identity and location"
          >
            <div className="grid gap-4 lg:grid-cols-3">
              <Field label="School Name">
                <input
                  value={profile.schoolName || ""}
                  onChange={(event) =>
                    updateProfileField(
                      "schoolName",
                      event.target.value
                    )
                  }
                  className={inputClassName}
                  placeholder="Green Valley School"
                />
              </Field>
              <Field label="State">
                <StateSelect
                  countryid={101}
                  defaultValue={
                    stateSelection ||
                    (profile.state
                      ? {
                          id: 0,
                          name: profile.state,
                        }
                      : undefined)
                  }
                  onChange={(state) => {
                    setStateSelection(state);
                    setCitySelection(null);
                    updateProfileField(
                      "state",
                      state?.name || ""
                    );
                    updateProfileField(
                      "city",
                      ""
                    );
                  }}
                  onTextChange={(event) =>
                    updateProfileField(
                      "state",
                      event.target.value
                    )
                  }
                  className="w-full"
                  containerClassName="w-full stdropdown-simple"
                  inputClassName={inputClassName}
                  placeHolder="Select state"
                />
              </Field>
              <Field label="City">
                <CitySelect
                  countryid={101}
                  stateid={
                    stateSelection?.id || 0
                  }
                  defaultValue={
                    citySelection ||
                    (profile.city
                      ? {
                          id: 0,
                          name: profile.city,
                        }
                      : undefined)
                  }
                  onChange={(city) => {
                    setCitySelection(city);
                    updateProfileField(
                      "city",
                      city?.name || ""
                    );
                  }}
                  onTextChange={(event) =>
                    updateProfileField(
                      "city",
                      event.target.value
                    )
                  }
                  className="w-full"
                  containerClassName="w-full stdropdown-simple"
                  inputClassName={inputClassName}
                  placeHolder="Select city"
                />
              </Field>
              <Field label="District">
                <input
                  value={profile.district || ""}
                  onChange={(event) =>
                    updateProfileField(
                      "district",
                      event.target.value
                    )
                  }
                  className={inputClassName}
                  placeholder="District name"
                />
              </Field>
              <Field label="PIN Code">
                <input
                  value={profile.pinCode || ""}
                  onChange={(event) =>
                    updateProfileField(
                      "pinCode",
                      event.target.value
                    )
                  }
                  className={inputClassName}
                  placeholder="201301"
                />
              </Field>
              <Field label="Principal Mobile">
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  value={profile.mobile || ""}
                  onChange={(event) =>
                    updateProfileField(
                      "mobile",
                      event.target.value
                        .replace(/\D/g, "")
                        .slice(0, 10)
                    )
                  }
                  className={inputClassName}
                  placeholder="9876543210"
                />
              </Field>
              <Field label="Address">
                <textarea
                  value={profile.address || ""}
                  onChange={(event) =>
                    updateProfileField(
                      "address",
                      event.target.value
                    )
                  }
                  className={`${inputClassName} resize-none lg:col-span-3`}
                  placeholder="123 Green Valley Road, Sector 45"
                />
              </Field>
            </div>

            <button
              type="button"
              disabled={savingProfile}
              onClick={saveProfile}
              className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 text-sm font-extrabold text-white shadow-lg shadow-indigo-100 disabled:opacity-60 sm:w-auto sm:px-5"
            >
              {savingProfile ? (
                <LoaderCircle
                  size={17}
                  className="animate-spin"
                />
              ) : (
                <Save size={17} />
              )}
              Save Profile
            </button>
          </SectionCard>

          <div className="space-y-4">
            <UploadPanel
              title="School Logo"
              subtitle="Background automatically removed"
              imageUrl={profile.logoUrl}
              uploading={uploadingLogo}
              checker
              icon={Image}
              onUpload={(file) =>
                handleImageUpload({
                  file,
                  type: "logo",
                })
              }
            />
            <UploadPanel
              title="Principal Signature"
              subtitle="Background automatically removed"
              imageUrl={profile.principalSignatureUrl}
              uploading={uploadingSignature}
              checker
              icon={FileSignature}
              onUpload={(file) =>
                handleImageUpload({
                  file,
                  type: "signature",
                })
              }
            />
            <UploadPanel
              title="School Stamp"
              subtitle="Background automatically removed"
              imageUrl={profile.stampUrl}
              uploading={uploadingStamp}
              checker
              icon={Stamp}
              onUpload={(file) =>
                handleImageUpload({
                  file,
                  type: "stamp",
                })
              }
            />
          </div>
        </div>
      )}

      {activeTab === "academic" && (
        <SectionCard
          eyebrow="Academic Year"
          title="Academic lifecycle controls"
          action={
            <button
              type="button"
              disabled={creatingYear}
              onClick={createAndPromoteAcademicYear}
              className="flex h-10 items-center gap-2 rounded-xl bg-indigo-600 px-3 text-xs font-extrabold text-white disabled:opacity-60"
            >
              <Plus size={15} />
              Create New Academic Year
            </button>
          }
        >
          <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-extrabold text-slate-950">
                    Active Academic Year
                  </p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    Controls class setup, promotions and archives
                  </p>
                </div>
                <span className="w-fit rounded-full bg-emerald-100 px-3 py-1 text-xs font-extrabold text-emerald-700">
                  {academicYears.activeAcademicYear || "No year"} Active
                </span>
              </div>
              <select
                value={academicYears.activeAcademicYear || ""}
                disabled={activatingYear}
                onChange={(event) =>
                  activateAcademicYear(
                    event.target.value
                  )
                }
                className={`mt-4 ${inputClassName}`}
              >
                {(academicYears.years || []).length === 0 ? (
                  <option value="">
                    No academic years yet
                  </option>
                ) : (
                  (academicYears.years || []).map(
                    (item) => (
                      <option
                        key={item.year}
                        value={item.year}
                      >
                        {item.year}
                      </option>
                    )
                  )
                )}
              </select>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <input
                  value={newAcademicYear}
                  onChange={(event) =>
                    setNewAcademicYear(
                      event.target.value
                    )
                  }
                  placeholder="2026-2027"
                  pattern="\d{4}-\d{4}"
                  title="Format: YYYY-YYYY (e.g. 2026-2027)"
                  className={inputClassName}
                />
                <button
                  type="button"
                  disabled={creatingYear}
                  onClick={createAndPromoteAcademicYear}
                  className="flex h-11 items-center justify-center gap-2 rounded-xl bg-orange-500 text-sm font-extrabold text-white disabled:opacity-60"
                >
                  <Users size={17} />
                  Create & Promote
                </button>
                <button
                  type="button"
                  disabled={
                    archivingYear ||
                    !academicYears.previousAcademicYear
                  }
                  onClick={() =>
                    toggleArchiveAcademicYear(
                      academicYears.previousAcademicYear,
                      true
                    )
                  }
                  className="flex h-11 items-center justify-between rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 disabled:opacity-60 sm:col-span-2"
                >
                  Archive old year
                  <StatusToggle enabled />
                </button>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 p-4">
              <p className="text-sm font-extrabold text-slate-950">
                Academic Years
              </p>
              {(academicYears.years || []).length === 0 ? (
                <p className="mt-3 rounded-xl bg-slate-50 px-3 py-4 text-sm font-semibold text-slate-500">
                  No academic years yet. Create one using the form on the left.
                </p>
              ) : (
                (academicYears.years || []).map((item) => (
                <div
                  key={item.year}
                  className="mt-3 flex items-center justify-between rounded-xl bg-slate-50 px-3 py-3"
                >
                  <div>
                    <span className="text-sm font-bold text-slate-700">
                      {item.year}
                    </span>
                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      {item.classes} classes
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={activatingYear}
                    onClick={() =>
                      item.isActive
                        ? null
                        : activateAcademicYear(
                            item.year
                          )
                    }
                    className={`rounded-full px-3 py-1 text-xs font-extrabold ${
                      item.isActive
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {item.isActive
                      ? "Active"
                      : "Set Active"}
                  </button>
                </div>
                ))
              )}
            </div>
          </div>
        </SectionCard>
      )}

      {activeTab === "fees" && (
        <div className="grid gap-5 xl:grid-cols-[260px_1fr]">
          <SectionCard
            eyebrow="Classes"
            title="Select class"
          >
            <div className="space-y-2">
              {structure.classes.length === 0 ? (
                <p className="rounded-xl bg-slate-50 p-4 text-sm font-semibold text-slate-500">
                  No active classes found.
                </p>
              ) : (
                structure.classes.map(
                  (singleClass) => (
                    <button
                      key={singleClass.id}
                      type="button"
                      onClick={() =>
                        setSelectedClassId(
                          singleClass.id
                        )
                      }
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-sm font-extrabold ${
                        selectedClass?.id ===
                        singleClass.id
                          ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100"
                          : "bg-slate-50 text-slate-700"
                      }`}
                    >
                      <span>{singleClass.name}</span>
                      <span className="text-xs opacity-80">
                        {singleClass.fees.length === 0 ? (
                          <span className="text-amber-200">0 fees</span>
                        ) : (
                          singleClass.fees.length
                        )}
                      </span>
                    </button>
                  )
                )
              )}
            </div>
          </SectionCard>

          <div className="space-y-5">
            <SectionCard
              eyebrow="Fee Template"
              title={`${selectedClass?.name || "Class"} fee structure`}
              action={
                <button
                  type="button"
                  className="flex h-10 items-center gap-2 rounded-xl bg-indigo-600 px-3 text-xs font-extrabold text-white shadow-lg shadow-indigo-100"
                >
                  <Plus size={15} />
                  Add Fee Item
                </button>
              }
            >
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-extrabold text-slate-950">
                    Create Fee Item
                  </p>
                  <div className="mt-4 grid gap-3">
                    <input
                      value={feeTypeForm.name}
                      onChange={(event) =>
                        setFeeTypeForm(
                          (current) => ({
                            ...current,
                            name:
                              event.target.value,
                          })
                        )
                      }
                      placeholder="Fee name"
                      className={inputClassName}
                    />
                    <input
                      type="number"
                      min="1"
                      value={feeTypeForm.defaultAmount}
                      onChange={(event) =>
                        setFeeTypeForm(
                          (current) => ({
                            ...current,
                            defaultAmount:
                              event.target.value,
                          })
                        )
                      }
                      placeholder="Default amount"
                      className={inputClassName}
                    />
                    <select
                      value={feeTypeForm.frequency}
                      onChange={(event) =>
                        setFeeTypeForm(
                          (current) => ({
                            ...current,
                            frequency:
                              event.target.value,
                          })
                        )
                      }
                      className={inputClassName}
                    >
                      <option value="Monthly">
                        Monthly
                      </option>
                      <option value="Quarterly">
                        Quarterly
                      </option>
                      <option value="Yearly">
                        Yearly
                      </option>
                    </select>
                    <label className="flex items-center justify-between rounded-xl bg-white px-3 py-3 text-sm font-bold text-slate-700">
                      Optional fee
                      <input
                        type="checkbox"
                        checked={feeTypeForm.isOptional}
                        onChange={(event) =>
                          setFeeTypeForm(
                            (current) => ({
                              ...current,
                              isOptional:
                                event.target.checked,
                            })
                          )
                        }
                      />
                    </label>
                    <button
                      type="button"
                      disabled={savingFee}
                      onClick={addFeeType}
                      className="flex h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 text-sm font-extrabold text-white disabled:opacity-60"
                    >
                      <Plus size={17} />
                      Add Fee Type
                    </button>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-extrabold text-slate-950">
                    Assign To Class
                  </p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    Only fees for {selectedClass?.name || "this class"} — not used on other classes.
                  </p>
                  <div className="mt-4 grid gap-3">
                    <select
                      value={classFeeForm.feeTypeId}
                      onChange={(event) => {
                        const feeType =
                          assignableFeeTypes.find(
                            (item) =>
                              item.id ===
                              event.target.value
                          );
                        setClassFeeForm(
                          (current) => ({
                            ...current,
                            feeTypeId:
                              event.target.value,
                            amount:
                              feeType?.defaultAmount ||
                              "",
                            isDefault:
                              !feeType?.isOptional,
                          })
                        );
                      }}
                      className={inputClassName}
                      disabled={
                        !selectedClass ||
                        assignableFeeTypes.length ===
                          0
                      }
                    >
                      <option value="">
                        {assignableFeeTypes.length ===
                        0
                          ? "No fees available — create one above"
                          : "Select fee type"}
                      </option>
                      {assignableFeeTypes.map(
                        (feeType) => (
                          <option
                            key={feeType.id}
                            value={feeType.id}
                          >
                            {feeType.name}
                          </option>
                        )
                      )}
                    </select>
                    <input
                      type="number"
                      min="1"
                      value={classFeeForm.amount}
                      onChange={(event) =>
                        setClassFeeForm(
                          (current) => ({
                            ...current,
                            amount:
                              event.target.value,
                          })
                        )
                      }
                      placeholder="Class amount"
                      className={inputClassName}
                    />
                    <label className="flex items-center justify-between rounded-xl bg-white px-3 py-3 text-sm font-bold text-slate-700">
                      Default for allocation
                      <input
                        type="checkbox"
                        checked={classFeeForm.isDefault}
                        onChange={(event) =>
                          setClassFeeForm(
                            (current) => ({
                              ...current,
                              isDefault:
                                event.target.checked,
                            })
                          )
                        }
                      />
                    </label>
                    <button
                      type="button"
                      disabled={
                        savingFee ||
                        !selectedClass
                      }
                      onClick={saveClassFee}
                      className="flex h-11 items-center justify-center gap-2 rounded-xl bg-orange-500 text-sm font-extrabold text-white disabled:opacity-60"
                    >
                      <Save size={17} />
                      Save Class Fee
                    </button>
                  </div>
                </div>
              </div>
            </SectionCard>

            {renderFeeTable({
              title:
                "Mandatory Fees",
              fees:
                mandatoryFees,
            })}
            {renderFeeTable({
              title:
                "Optional Fees",
              fees:
                optionalFees,
              optional: true,
            })}
            {(selectedClass?.archivedFees || []).length > 0 &&
              renderFeeTable({
                title: "Archived Fees",
                fees: selectedClass.archivedFees,
                archived: true,
              })}
            <button
              type="button"
              disabled={
                allocating ||
                !selectedClass
              }
              onClick={allocateFees}
              className="fixed bottom-24 right-5 z-20 flex h-14 items-center gap-2 rounded-full bg-indigo-600 px-5 text-sm font-extrabold text-white shadow-2xl shadow-indigo-200 lg:static lg:h-11 lg:rounded-xl lg:shadow-lg"
            >
              {allocating ? (
                <LoaderCircle
                  size={18}
                  className="animate-spin"
                />
              ) : (
                <CheckCircle2 size={18} />
              )}
              Allocate Selected
            </button>
          </div>
        </div>
      )}

      {activeTab === "receipt" && (
        <div className="space-y-5">
          <SectionCard
            eyebrow="Receipt Settings"
            title="PDF receipt defaults"
          >
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Receipt Prefix">
                <input
                  value={receiptSettings.prefix}
                  onChange={(event) =>
                    setReceiptSettings(
                      (current) => ({
                        ...current,
                        prefix:
                          event.target.value,
                      })
                    )
                  }
                  placeholder="e.g. FB"
                  className={inputClassName}
                />
                <p className="mt-1 text-xs font-semibold text-slate-500">
                  Receipt number format: PREFIX/CURRENT_YEAR/000001 (calendar year, not academic year)
                </p>
              </Field>
              <button
                type="button"
                onClick={() =>
                  setShowReceiptPreview(true)
                }
                className="mt-6 flex h-11 items-center justify-center gap-2 rounded-xl border border-indigo-100 bg-indigo-50 text-sm font-extrabold text-indigo-700"
              >
                <ReceiptText size={17} />
                Receipt Preview
              </button>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {[
                {
                  label: "Signature",
                  key: "signature",
                  icon: FileSignature,
                },
                {
                  label: "School Stamp",
                  key: "stamp",
                  icon: Stamp,
                },
              ].map((item) => {
                const ReceiptIcon =
                  item.icon;

                return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() =>
                    setReceiptSettings(
                      (current) => ({
                        ...current,
                        [item.key]:
                          !current[item.key],
                      })
                    )
                  }
                  className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <span className="flex items-center gap-2 text-sm font-extrabold text-slate-800">
                    <ReceiptIcon size={17} />
                    {item.label}
                  </span>
                  <StatusToggle
                    enabled={
                      receiptSettings[item.key]
                    }
                  />
                </button>
                );
              })}
            </div>
            <Field label="Footer Note">
              <textarea
                value={receiptSettings.footer}
                onChange={(event) =>
                  setReceiptSettings(
                    (current) => ({
                      ...current,
                      footer:
                        event.target.value,
                    })
                  )
                }
                className={`mt-3 ${textareaClassName}`}
              />
            </Field>
            <button
              type="button"
              disabled={savingPreferences}
              onClick={savePreferences}
              className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 text-sm font-extrabold text-white shadow-lg shadow-indigo-100 disabled:opacity-60 sm:w-auto sm:px-5"
            >
              {savingPreferences ? (
                <LoaderCircle
                  size={17}
                  className="animate-spin"
                />
              ) : (
                <Save size={17} />
              )}
              Save Receipt Settings
            </button>
          </SectionCard>
        </div>
      )}

      {activeTab === "payments" && (
        <SectionCard
          eyebrow="Payment Modes"
          title="Allowed collection channels"
          action={
            <button
              type="button"
              disabled={savingPreferences}
              onClick={savePreferences}
              className="flex h-10 items-center gap-2 rounded-xl bg-indigo-600 px-3 text-xs font-extrabold text-white disabled:opacity-60"
            >
              {savingPreferences ? (
                <LoaderCircle
                  size={15}
                  className="animate-spin"
                />
              ) : (
                <Save size={15} />
              )}
              Save
            </button>
          }
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {paymentModes.map((mode) => {
              const ModeIcon =
                mode.icon;
              const enabled =
                enabledModes.includes(
                  mode.name
                );

              return (
                <button
                  key={mode.name}
                  type="button"
                  onClick={() =>
                    setEnabledModes(
                      (current) =>
                        enabled
                          ? current.filter(
                              (item) =>
                                item !==
                                mode.name
                            )
                          : [
                              ...current,
                              mode.name,
                            ]
                    )
                  }
                  className={`rounded-2xl border p-4 text-left ${mode.color}`}
                >
                  <div className="flex items-center justify-between">
                    <ModeIcon size={24} />
                    <StatusToggle enabled={enabled} />
                  </div>
                  <p className="mt-5 text-base font-extrabold">
                    {mode.name}
                  </p>
                  <p className="mt-1 text-xs font-bold opacity-70">
                    {enabled
                      ? "Enabled"
                      : "Disabled"}
                  </p>
                </button>
              );
            })}
          </div>
        </SectionCard>
      )}

      {showReceiptPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-3 py-4 sm:px-4 sm:py-6">
          <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() =>
                setShowReceiptPreview(false)
              }
              className="sticky top-4 right-4 ml-auto flex h-9 w-9 items-center justify-center rounded-full border-2 border-slate-300 bg-white text-slate-600 hover:bg-slate-100 hover:border-slate-400 transition shadow-sm"
              title="Close preview"
            >
              <span className="text-lg font-bold">✕</span>
            </button>
            <div className="p-4 sm:p-6">
              <h3 className="text-lg font-extrabold text-slate-950 mb-4">Receipt Preview</h3>
              <ReceiptPreview
                profile={profile}
                settings={receiptSettings}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
