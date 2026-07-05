import {
  Image,
  LoaderCircle,
  Plus,
  Upload,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import {
  getClassesByStatus,
} from "../../lib/api/classapi.js";

import {
  getSectionsByClass,
} from "../../lib/api/sectionapi.js";

import {
  createStudent,
  getImageKitAuth,
  importStudents,
} from "../../lib/api/studentapi.js";

import {
  notify,
} from "../../lib/toast.js";

const emptyForm = {
  schoolRegisterNo: "",
  firstName: "",
  lastName: "",
  fatherName: "",
  dob: "",
  phone: "",
  gender: "",
  aadharNo: "",
  aadharVerificationStatus: "",
  admissionDate: "",
  photoUrl: "",
  photoFileId: "",
};

const requiredFields = [
  "schoolRegisterNo",
  "firstName",
  "fatherName",
  "dob",
  "phone",
  "gender",
];

const manualFieldsBeforePhone = [
  [
    "schoolRegisterNo",
    "Sr no",
    "School register number",
  ],
  [
    "firstName",
    "First name",
    "Student first name",
  ],
  [
    "lastName",
    "Last name",
    "Optional",
  ],
  [
    "fatherName",
    "Father name",
    "Father full name",
  ],
];

const digitsOnly =
  (
    value,
    maxLen
  ) =>
    String(
      value || ""
    )
      .replace(
        /\D/g,
        ""
      )
      .slice(
        0,
        maxLen
      );

const toBase64 =
  (file) =>
    new Promise(
      (resolve, reject) => {
        const reader =
          new FileReader();

        reader.onload =
          () => {
            const result =
              String(reader.result);

            resolve(
              result.includes(",")
                ? result.split(",")[1]
                : result
            );
          };

        reader.onerror =
          reject;
        reader.readAsDataURL(file);
      }
    );

const formatDateForApi =
  (value) => {
    if (!value) {
      return "";
    }

    const [
      year,
      month,
      day,
    ] =
      value.split("-");

    return `${day}/${month}/${year}`;
  };

const formatDateForInput =
  (value) => {
    if (
      !/^\d{2}\/\d{2}\/\d{4}$/.test(value)
    ) {
      return "";
    }

    const [
      day,
      month,
      year,
    ] =
      value.split("/");

    return `${year}-${month}-${day}`;
  };

export default function AddStudentModal({
  selectedClass =
    null,
  selectedSection =
    null,
  enableClassSectionPickers =
    false,
  initialMode = "manual",
  onClose,
  onSaved,
}) {
  const [
    pickedClass,
    setPickedClass,
  ] = useState(
    enableClassSectionPickers
      ? null
      : selectedClass
  );

  const [
    pickedSection,
    setPickedSection,
  ] = useState(
    enableClassSectionPickers
      ? null
      : selectedSection
  );

  const [
    classesOptions,

    setClassesOptions,
  ] = useState(
    []
  );

  const [
    sectionsOptions,

    setSectionsOptions,
  ] = useState(
    []
  );

  const [
    loadingClasses,

    setLoadingClasses,
  ] = useState(
    false
  );

  const [
    loadingSections,

    setLoadingSections,
  ] = useState(
    false
  );

  const resolvedClass =
    enableClassSectionPickers
      ? pickedClass
      : selectedClass;

  const resolvedSection =
    enableClassSectionPickers
      ? pickedSection
      : selectedSection;

  useEffect(
    () => {
      if (
        !enableClassSectionPickers
      ) {
        return;
      }

      let active = true;

      (async () => {
        try {
          setLoadingClasses(true);
          const rows =
            await getClassesByStatus(
              "active"
            );

          if (!active) {
            return;
          }

          setClassesOptions(
            rows || []
          );
        } catch (error) {
          notify.error(
            error,
            "Classes could not be loaded"
          );
        } finally {
          if (active) {
            setLoadingClasses(
              false
            );
          }
        }
      })();

      return () => {
        active = false;
      };
    },
    [
      enableClassSectionPickers,
    ]
  );

  useEffect(
    () => {
      if (
        !enableClassSectionPickers ||
        !pickedClass?.id
      ) {
        setSectionsOptions(
          []
        );
        setPickedSection(
          null
        );
        return;
      }

      let active = true;

      (async () => {
        try {
          setLoadingSections(true);
          const rows =
            await getSectionsByClass({
              classId: pickedClass.id,
            });

          if (!active) {
            return;
          }

          setSectionsOptions(
            rows || []
          );
        } catch (error) {
          notify.error(
            error,
            "Sections could not be loaded"
          );
        } finally {
          if (active) {
            setLoadingSections(
              false
            );
          }
        }
      })();

      return () => {
        active = false;
      };
    },
    [
      enableClassSectionPickers,
      pickedClass?.id,
    ]
  );

  const [
    mode,
    setMode,
  ] = useState(initialMode);

  const [
    form,
    setForm,
  ] = useState(emptyForm);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    importing,
    setImporting,
  ] = useState(false);

  const [
    photoUploading,
    setPhotoUploading,
  ] = useState(false);

  const [
    importResult,
    setImportResult,
  ] = useState(null);

  const contextReady =
    Boolean(
      resolvedClass?.id &&
      resolvedSection?.id
    );

  const phoneDigits =
    digitsOnly(
      form.phone,
      10
    );

  const aadharDigits =
    digitsOnly(
      form.aadharNo,
      12
    );

  const phoneValid =
    /^\d{10}$/.test(
      phoneDigits
    );

  const aadharValid =
    aadharDigits.length === 0 ||
    /^\d{12}$/.test(
      aadharDigits
    );

  const canSubmit =
    contextReady &&
    requiredFields
      .filter(
        (
          field
        ) =>
          field !== "phone"
      )
      .every(
        (field) =>
          form[field].trim()
      ) &&
    phoneValid &&
    aadharValid &&
    /^\d{2}\/\d{2}\/\d{4}$/.test(
      form.dob
    );

  const updateForm =
    (field, value) => {
      setForm((current) => ({
        ...current,
        [field]: value,
      }));
    };

  const uploadPhoto =
    async (file) => {
      if (!file) {
        return;
      }

      try {
        setPhotoUploading(true);
        const auth =
          await getImageKitAuth();

        const body =
          new FormData();

        body.append("file", file);
        body.append("fileName", file.name);
        body.append("publicKey", auth.publicKey);
        body.append("signature", auth.signature);
        body.append("expire", auth.expire);
        body.append("token", auth.token);
        body.append("folder", "/feego/students");

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
            "Photo upload failed"
          );
        }

        const uploaded =
          await response.json();

        setForm((current) => ({
          ...current,
          photoUrl:
            uploaded.url || "",
          photoFileId:
            uploaded.fileId || "",
        }));
      } catch (error) {
        notify.error(error, "Photo could not be uploaded");
      } finally {
        setPhotoUploading(false);
      }
    };

  const handleCreate =
    async () => {
      if (
        !canSubmit ||
        saving
      ) {
        return;
      }

      try {
        setSaving(true);
        await createStudent({
          ...form,
          phone:
            phoneDigits,
          aadharNo:
            aadharDigits,
          classId:
            resolvedClass.id,
          sectionId:
            resolvedSection.id,
        });

        try {
          await onSaved();
        } catch {
          /* ignore refresh errors */
        }

        notify.success(
          "Student added successfully"
        );
        onClose();
      } catch (error) {
        notify.error(error, "Student could not be added");
      } finally {
        setSaving(false);
      }
    };

  const handleImport =
    async (file) => {
      if (
        !file ||
        !contextReady
      ) {
        return;
      }

      try {
        setImporting(true);
        setImportResult(null);
        const fileBase64 =
          await toBase64(file);

        const result =
          await importStudents({
            classId:
              resolvedClass.id,
            sectionId:
              resolvedSection.id,
            fileName:
              file.name,
            fileBase64,
          });

        setImportResult(result);
        await onSaved();

        if (result.created > 0 && result.skipped === 0) {
          notify.success(
            `${result.created} students imported successfully!`
          );
          onClose();
        }
      } catch (error) {
        notify.error(error, "Students could not be imported");
      } finally {
        setImporting(false);
      }
    };

  return (
    <div
      role="presentation"
      onClick={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose();
        }
      }}
      className="
        fixed
        inset-0
        z-[90]
        flex
        items-end
        justify-center
        bg-slate-950/40
        p-0
        sm:items-center
        sm:p-4
      "
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-student-title"
        onClick={(event) =>
          event.stopPropagation()
        }
        className="
          flex
          max-h-[92vh]
          w-full
          max-w-4xl
          flex-col
          overflow-hidden
          rounded-t-2xl
          bg-white
          shadow-2xl
          sm:rounded-2xl
        "
      >
        <div
          className="
            flex
            flex-col
            gap-4
            border-b
            border-slate-200
            px-5
            py-5
            sm:flex-row
            sm:items-center
            sm:justify-between
          "
        >
          <div>
            <h2
              id="add-student-title"
              className="
                text-lg
                font-bold
                text-slate-950
              "
            >
              Add Student
            </h2>
            <p
              className="
                mt-1
                text-sm
                text-slate-500
              "
            >
              {
                contextReady
                  ? `${resolvedClass.name} - Section ${resolvedSection.name}`
                  : "Select class and section to continue"
              }
            </p>
          </div>

          <div
            className="
              flex
              rounded-xl
              border
              border-slate-200
              bg-slate-50
              p-1
            "
          >
            <button
              type="button"
              onClick={() =>
                setMode("manual")
              }
              className={`
                rounded-lg
                px-4
                py-2
                text-sm
                font-semibold
                ${
                  mode === "manual"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-500"
                }
              `}
            >
              Manual Entry
            </button>
            <button
              type="button"
              onClick={() =>
                setMode("excel")
              }
              className={`
                rounded-lg
                px-4
                py-2
                text-sm
                font-semibold
                ${
                  mode === "excel"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-500"
                }
              `}
            >
              Excel Upload
            </button>
          </div>
        </div>

        {
          enableClassSectionPickers && (
            <div
              className="
                grid
                gap-3
                border-b
                border-slate-200
                bg-slate-50/80
                px-5
                py-4
                sm:grid-cols-2
              "
            >
              <label
                className="
                  space-y-1.5
                "
              >
                <span
                  className="
                    text-xs
                    font-bold
                    text-slate-600
                  "
                >
                  Class
                </span>
                <select
                  value={
                    pickedClass?.id ||
                    ""
                  }
                  disabled={
                    loadingClasses
                  }
                  onChange={(event) => {
                    const next =
                      classesOptions.find(
                        (row) =>
                          row.id ===
                          event.target.value
                      ) ||
                      null;

                    setPickedClass(
                      next
                    );
                  }}
                  className="
                    h-12
                    w-full
                    rounded-xl
                    border
                    border-slate-200
                    bg-white
                    px-3.5
                    text-sm
                    font-medium
                    text-slate-800
                  "
                >
                  <option value="">
                    {
                      loadingClasses
                        ? "Loading..."
                        : "Select class"
                    }
                  </option>
                  {
                    classesOptions.map(
                      (row) => (
                        <option
                          key={row.id}
                          value={row.id}
                        >
                          {row.name}
                        </option>
                      )
                    )
                  }
                </select>
              </label>

              <label
                className="
                  space-y-1.5
                "
              >
                <span
                  className="
                    text-xs
                    font-bold
                    text-slate-600
                  "
                >
                  Section
                </span>
                <select
                  value={
                    pickedSection?.id ||
                    ""
                  }
                  disabled={
                    loadingSections ||
                    !pickedClass
                  }
                  onChange={(event) => {
                    const next =
                      sectionsOptions.find(
                        (row) =>
                          row.id ===
                          event.target.value
                      ) ||
                      null;

                    setPickedSection(
                      next
                    );
                  }}
                  className="
                    h-12
                    w-full
                    rounded-xl
                    border
                    border-slate-200
                    bg-white
                    px-3.5
                    text-sm
                    font-medium
                    text-slate-800
                  "
                >
                  <option value="">
                    {
                      loadingSections
                        ? "Loading..."
                        : "Select section"
                    }
                  </option>
                  {
                    sectionsOptions.map(
                      (row) => (
                        <option
                          key={row.id}
                          value={row.id}
                        >
                          {row.name}
                        </option>
                      )
                    )
                  }
                </select>
              </label>
            </div>
          )
        }

        {
          mode === "manual" ? (
            <div
              className="
                grid
                min-h-0
                flex-1
                gap-4
                overflow-y-auto
                px-5
                py-5
                sm:grid-cols-2
              "
            >
              {
                manualFieldsBeforePhone.map(
                  ([
                    field,
                    label,
                    placeholder,
                  ]) => (

                    <label
                      key={field}
                      className="
                        space-y-1.5
                      "
                    >
                      <span
                        className="
                          text-xs
                          font-bold
                          text-slate-600
                        "
                      >
                        {label}
                      </span>
                      <input
                        value={
                          form[field]
                        }
                        disabled={
                          !contextReady
                        }
                        onChange={(event) =>
                          updateForm(
                            field,
                            event.target.value
                          )
                        }
                        placeholder={
                          placeholder
                        }
                        className="
                          h-12
                          w-full
                          rounded-xl
                          border
                          border-slate-200
                          bg-white
                          px-3.5
                          text-sm
                          font-medium
                          text-slate-800
                          outline-none
                          transition
                          placeholder:text-slate-400
                          focus:border-blue-500
                          focus:ring-4
                          focus:ring-blue-50
                          disabled:cursor-not-allowed
                          disabled:bg-slate-100
                        "
                      />
                    </label>
                  )
                )
              }

              <label
                className="
                  space-y-1.5
                "
              >
                <span
                  className="
                    text-xs
                    font-bold
                    text-slate-600
                  "
                >
                  Mobile number
                </span>
                <input
                  inputMode="numeric"
                  autoComplete="tel"
                  maxLength={10}
                  value={
                    form.phone
                  }
                  disabled={
                    !contextReady
                  }
                  onChange={(event) =>
                    updateForm(
                      "phone",
                      digitsOnly(
                        event.target
                          .value,
                        10
                      )
                    )
                  }
                  placeholder="10-digit mobile"
                  className={`
                    h-12
                    w-full
                    rounded-xl
                    border
                    bg-white
                    px-3.5
                    text-sm
                    font-medium
                    text-slate-800
                    outline-none
                    transition
                    placeholder:text-slate-400
                    focus:border-blue-500
                    focus:ring-4
                    focus:ring-blue-50
                    disabled:cursor-not-allowed
                    disabled:bg-slate-100
                    ${
                      contextReady &&
                      form.phone &&
                      !phoneValid
                        ? "border-red-300"
                        : "border-slate-200"
                    }
                  `}
                />
                <span
                  className="
                    block
                    text-[11px]
                    font-medium
                    text-slate-500
                  "
                >
                  {form.phone.length}
                  /10 digits
                </span>
              </label>

              <label
                className="
                  space-y-1.5
                "
              >
                <span
                  className="
                    text-xs
                    font-bold
                    text-slate-600
                  "
                >
                  Aadhar no
                  {" "}
                  <span
                    className="
                      font-normal
                      text-slate-400
                    "
                  >
                    (optional)
                  </span>
                </span>
                <input
                  inputMode="numeric"
                  maxLength={12}
                  value={
                    form.aadharNo
                  }
                  disabled={
                    !contextReady
                  }
                  onChange={(event) =>
                    updateForm(
                      "aadharNo",
                      digitsOnly(
                        event.target
                          .value,
                        12
                      )
                    )
                  }
                  placeholder="12 digits if provided"
                  className={`
                    h-12
                    w-full
                    rounded-xl
                    border
                    bg-white
                    px-3.5
                    text-sm
                    font-medium
                    text-slate-800
                    outline-none
                    transition
                    placeholder:text-slate-400
                    focus:border-blue-500
                    focus:ring-4
                    focus:ring-blue-50
                    disabled:cursor-not-allowed
                    disabled:bg-slate-100
                    ${
                      contextReady &&
                      form.aadharNo &&
                      !aadharValid
                        ? "border-red-300"
                        : "border-slate-200"
                    }
                  `}
                />
                {
                  form.aadharNo
                    .length > 0 &&
                  form.aadharNo
                    .length < 12 && (
                    <span
                      className="
                        block
                        text-[11px]
                        font-semibold
                        text-orange-600
                      "
                    >
                      Enter all 12 digits or leave blank.
                    </span>
                  )
                }
              </label>

              <label
                className="
                  space-y-1.5
                "
              >
                <span
                  className="
                    text-xs
                    font-bold
                    text-slate-600
                  "
                >
                  Date of birth
                </span>
                <input
                  type="date"
                  disabled={
                    !contextReady
                  }
                  value={formatDateForInput(
                    form.dob
                  )}
                  onChange={(event) =>
                    updateForm(
                      "dob",
                      formatDateForApi(
                        event.target.value
                      )
                    )
                  }
                  className="
                    h-12
                    w-full
                    rounded-xl
                    border
                    border-slate-200
                    bg-white
                    px-3.5
                    text-sm
                    font-medium
                    text-slate-800
                    outline-none
                    transition
                    focus:border-blue-500
                    focus:ring-4
                    focus:ring-blue-50
                    disabled:cursor-not-allowed
                    disabled:bg-slate-100
                  "
                />
              </label>

              <label
                className="
                  space-y-1.5
                "
              >
                <span
                  className="
                    text-xs
                    font-bold
                    text-slate-600
                  "
                >
                  Admission date
                </span>
                <input
                  type="date"
                  disabled={
                    !contextReady
                  }
                  value={formatDateForInput(
                    form.admissionDate
                  )}
                  onChange={(event) =>
                    updateForm(
                      "admissionDate",
                      formatDateForApi(
                        event.target.value
                      )
                    )
                  }
                  className="
                    h-12
                    w-full
                    rounded-xl
                    border
                    border-slate-200
                    bg-white
                    px-3.5
                    text-sm
                    font-medium
                    text-slate-800
                    outline-none
                    transition
                    focus:border-blue-500
                    focus:ring-4
                    focus:ring-blue-50
                    disabled:cursor-not-allowed
                    disabled:bg-slate-100
                  "
                />
              </label>

              <label
                className="
                  space-y-1.5
                "
              >
                <span
                  className="
                    text-xs
                    font-bold
                    text-slate-600
                  "
                >
                  Gender
                </span>
                <select
                  value={form.gender}
                  disabled={
                    !contextReady
                  }
                  onChange={(event) =>
                    updateForm(
                      "gender",
                      event.target.value
                    )
                  }
                  className="
                    h-12
                    w-full
                    rounded-xl
                    border
                    border-slate-200
                    bg-white
                    px-3.5
                    text-sm
                    font-medium
                    text-slate-800
                    outline-none
                    transition
                    focus:border-blue-500
                    focus:ring-4
                    focus:ring-blue-50
                    disabled:cursor-not-allowed
                    disabled:bg-slate-100
                  "
                >
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </label>

              <label
                className="
                  space-y-1.5
                "
              >
                <span
                  className="
                    text-xs
                    font-bold
                    text-slate-600
                  "
                >
                  Aadhar verification
                </span>
                <select
                  value={
                    form.aadharVerificationStatus
                  }
                  disabled={
                    !contextReady
                  }
                  onChange={(event) =>
                    updateForm(
                      "aadharVerificationStatus",
                      event.target.value
                    )
                  }
                  className="
                    h-12
                    w-full
                    rounded-xl
                    border
                    border-slate-200
                    bg-white
                    px-3.5
                    text-sm
                    font-medium
                    text-slate-800
                    outline-none
                    transition
                    focus:border-blue-500
                    focus:ring-4
                    focus:ring-blue-50
                    disabled:cursor-not-allowed
                    disabled:bg-slate-100
                  "
                >
                  <option value="">Optional status</option>
                  <option value="Verified">Verified</option>
                  <option value="Pending">Pending</option>
                  <option value="Not Verified">Not Verified</option>
                </select>
              </label>

              <label
                className="
                  flex
                  cursor-pointer
                  items-center
                  justify-center
                  gap-2
                  rounded-xl
                  border
                  border-dashed
                  border-slate-300
                  px-3
                  py-3
                  text-sm
                  font-medium
                  text-slate-600
                "
              >
                {
                  photoUploading ? (
                    <LoaderCircle
                      size={16}
                      className="animate-spin"
                    />
                  ) : (
                    <Image size={16} />
                  )
                }
                {
                  form.photoUrl
                    ? "Photo uploaded"
                    : "Photo optional"
                }
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  disabled={
                    !contextReady
                  }
                  onChange={(event) =>
                    uploadPhoto(
                      event.target.files?.[0]
                    )
                  }
                />
              </label>
            </div>
          ) : (
            <div
              className="
                min-h-0
                flex-1
                overflow-y-auto
                px-5
                py-5
              "
            >
              <label
                className="
                  flex
                  cursor-pointer
                  flex-col
                  items-center
                  justify-center
                  gap-3
                  rounded-2xl
                  border
                  border-dashed
                  border-slate-300
                  bg-slate-50
                  p-8
                  text-center
                "
              >
                {
                  importing ? (
                    <LoaderCircle
                      size={28}
                      className="animate-spin text-blue-600"
                    />
                  ) : (
                    <Upload
                      size={28}
                      className="text-blue-600"
                    />
                  )
                }
                <span
                  className="
                    text-sm
                    font-semibold
                    text-slate-800
                  "
                >
                  Upload Excel Sheet
                </span>
                <span
                  className="
                    max-w-xl
                    text-xs
                    text-slate-500
                  "
                >
                  Required columns: Sr no, name of students, father name, DOB, mobile number, gender. Optional: aadhar no, verification status of aadhar, admission date.
                </span>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  hidden
                  disabled={
                    !contextReady ||
                    importing
                  }
                  onChange={(event) =>
                    handleImport(
                      event.target.files?.[0]
                    )
                  }
                />
              </label>

              {
                importResult && (
                  <div
                    className={`
                      mt-4
                      rounded-xl
                      border
                      p-4
                      text-sm
                      ${importResult.skipped > 0
                        ? "border-orange-200 bg-orange-50 text-orange-800"
                        : "border-green-200 bg-green-50 text-green-800"}
                    `}
                  >
                    <p className="font-semibold">
                      Imported {importResult.created} students.{" "}
                      {importResult.skipped > 0 && `Skipped ${importResult.skipped}.`}
                    </p>
                    {
                      importResult.errors
                        ?.length > 0 && (
                        <div
                          className="
                            mt-3
                            max-h-28
                            overflow-y-auto
                            text-xs
                            text-orange-700
                          "
                        >
                          {
                            importResult.errors.map(
                              (item) => (
                                <p
                                  key={`${item.rowNumber}-${item.message}`}
                                >
                                  Row {item.rowNumber}: {item.message}
                                </p>
                              )
                            )
                          }
                        </div>
                      )
                    }
                    {
                      importResult.skipped > 0 && (
                        <label
                          className="
                            mt-3
                            inline-flex
                            cursor-pointer
                            items-center
                            gap-2
                            rounded-lg
                            bg-orange-600
                            px-4
                            py-2
                            text-xs
                            font-semibold
                            text-white
                            hover:bg-orange-700
                          "
                        >
                          Re-upload File
                          <input
                            type="file"
                            accept=".xlsx,.xls"
                            hidden
                            onChange={(event) => {
                              setImportResult(null);
                              handleImport(event.target.files?.[0]);
                            }}
                          />
                        </label>
                      )
                    }
                  </div>
                )
              }
            </div>
          )
        }

        <div
          className="
            flex
            shrink-0
            items-center
            justify-end
            gap-3
            border-t
            border-slate-200
            bg-white
            px-5
            py-5
          "
        >
          <button
            type="button"
            onClick={onClose}
            className="
              rounded-xl
              border
              border-slate-200
              px-5
              py-3
              text-sm
              font-medium
              text-slate-700
            "
          >
            Close
          </button>

          {
            mode === "manual" && (
              <button
                type="button"
                disabled={
                  !canSubmit ||
                  saving
                }
                onClick={handleCreate}
                className={`
                  flex
                  items-center
                  justify-center
                  gap-2
                  rounded-xl
                  px-5
                  py-3
                  text-sm
                  font-semibold
                  text-white
                  ${
                    canSubmit &&
                    !saving
                      ? "bg-blue-600 hover:bg-blue-700"
                      : "cursor-not-allowed bg-slate-300"
                  }
                `}
              >
                {
                  saving ? (
                    <LoaderCircle
                      size={18}
                      className="animate-spin"
                    />
                  ) : (
                    <Plus size={18} />
                  )
                }
                Add Student
              </button>
            )
          }
        </div>
      </div>
    </div>
  );
}
