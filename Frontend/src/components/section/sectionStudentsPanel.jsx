import {
  FileSpreadsheet,
  Image,
  LoaderCircle,
  Plus,
  Upload,
  User,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getClassFeeStructureStatus,
} from "../../lib/api/feesapi.js";

import {
  createStudent,
  getImageKitAuth,
  getStudentsBySection,
  importStudents,
} from "../../lib/api/studentapi.js";

import {
  notify,
} from "../../lib/toast.js";

import {
  CardListSkeleton,
  FormPanelSkeleton,
} from "../skeleton/PageSkeletons.jsx";

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

        reader.readAsDataURL(
          file
        );
      }
    );

const getInitials =
  (student) => {
    const first =
      student.firstName?.[0] ||
      student.fullName?.[0] ||
      "S";

    const last =
      student.lastName?.[0] ||
      "";

    return `${first}${last}`
      .toUpperCase();
  };

export default function SectionStudentsPanel({
  selectedClass,
  section,
  onRefresh,
}) {
  const [
    students,
    setStudents,
  ] = useState([]);

  const [
    activeMode,
    setActiveMode,
  ] = useState("manual");

  const [
    form,
    setForm,
  ] = useState(emptyForm);

  const [
    loading,
    setLoading,
  ] = useState(true);

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

  const [
    feeStructureReady,
    setFeeStructureReady,
  ] = useState(false);

  useEffect(() => {
    if (!selectedClass?.id) {
      setFeeStructureReady(false);
      return;
    }

    let cancelled = false;

    getClassFeeStructureStatus(
      selectedClass.id
    )
      .then((status) => {
        if (!cancelled) {
          setFeeStructureReady(
            Boolean(
              status?.hasFeeStructure
            )
          );
        }
      })
      .catch(() => {
        if (!cancelled) {
          setFeeStructureReady(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selectedClass?.id]);

  const canSubmit =
    useMemo(
      () =>
        feeStructureReady &&
        !selectedClass.isArchived &&
        !section.isArchived &&
        requiredFields.every(
          (field) =>
            form[field]
              .trim()
              .length > 0
        ) &&
        /^\d{2}\/\d{2}\/\d{4}$/.test(
          form.dob
        ),
      [
        form,
        selectedClass.isArchived,
        section.isArchived,
      ]
    );

  const canManageStudents =
    !selectedClass.isArchived &&
    !section.isArchived;

  const refreshStudents =
    useCallback(async () => {
      const result =
        await getStudentsBySection({
          classId:
            selectedClass.id,
          sectionId:
            section.id,
        });

      setStudents(
        Array.isArray(result)
          ? result
          : result.students || []
      );
    }, [
      selectedClass.id,
      section.id,
    ]);

  useEffect(() => {
    const load =
      async () => {
        try {
          setLoading(true);
          await refreshStudents();
        } catch (error) {
          console.log(error);
        } finally {
          setLoading(false);
        }
      };

    load();
  }, [refreshStudents]);

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

        body.append(
          "file",
          file
        );
        body.append(
          "fileName",
          file.name
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
          "/feesbook/students"
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
        notify.error(
          error,
          "Photo could not be uploaded"
        );
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
          classId:
            selectedClass.id,
          sectionId:
            section.id,
        });

        setForm(emptyForm);
        await refreshStudents();
        await onRefresh();
        notify.success(
          "Student added successfully"
        );
      } catch (error) {
        notify.error(
          error,
          "Student could not be added"
        );
      } finally {
        setSaving(false);
      }
    };

  const handleImport =
    async (file) => {
      if (!file) {
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
              selectedClass.id,
            sectionId:
              section.id,
            fileName:
              file.name,
            fileBase64,
          });

        setImportResult(result);
        await refreshStudents();
        await onRefresh();
        notify.success(
          "Students imported successfully"
        );
      } catch (error) {
        notify.error(
          error,
          "Students could not be imported"
        );
      } finally {
        setImporting(false);
      }
    };

  return (
    <div
      className="
        mt-6
        border-t
        border-slate-200
        pt-5
      "
    >
      <div
        className="
          flex
          flex-col
          gap-3
          sm:flex-row
          sm:items-center
          sm:justify-between
        "
      >
        <div>
          <h3
            className="
              text-base
              font-bold
              text-slate-900
            "
          >
            Students
          </h3>

        <p
            className="
              mt-1
              text-xs
              text-slate-500
            "
          >
            {
              !canManageStudents
                ? "Archived sections are view only."
                : !feeStructureReady
                  ? "Define fee structure in Settings → Fees for this class before adding students."
                  : "Add manually or import from Excel."
            }
          </p>
        </div>

        <div
          className="
            flex
            rounded-2xl
            border
            border-slate-200
            bg-white
            p-1
          "
        >
          <button
            disabled={
              !canManageStudents
            }
            onClick={() =>
              setActiveMode(
                "manual"
              )
            }
            className={`
              flex
              items-center
              gap-2
              rounded-xl
              px-3
              py-2
              text-xs
              font-semibold
              ${
                activeMode ===
                "manual"
                  ? "bg-blue-600 text-white"
                  : "text-slate-500"
              }
            `}
          >
            <Plus
              size={14}
            />
            Manual
          </button>

          <button
            disabled={
              !canManageStudents
            }
            onClick={() =>
              setActiveMode(
                "excel"
              )
            }
            className={`
              flex
              items-center
              gap-2
              rounded-xl
              px-3
              py-2
              text-xs
              font-semibold
              ${
                activeMode ===
                "excel"
                  ? "bg-blue-600 text-white"
                  : "text-slate-500"
              }
            `}
          >
            <FileSpreadsheet
              size={14}
            />
            Excel
          </button>
        </div>
      </div>

      {
        !canManageStudents ? (
          <div
            className="
              mt-4
              rounded-2xl
              border
              border-orange-100
              bg-orange-50
              p-4
              text-sm
              font-medium
              text-orange-700
            "
          >
            Restore this class and section before adding or importing students.
          </div>
        ) : activeMode === "manual" ? (
          <div
            className="
              mt-4
              grid
              gap-3
              sm:grid-cols-2
            "
          >
            <input
              value={
                form.schoolRegisterNo
              }
              onChange={(event) =>
                updateForm(
                  "schoolRegisterNo",
                  event.target.value
                )
              }
              placeholder="Sr no / school register no"
              className="rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-blue-500"
            />

            <input
              value={form.firstName}
              onChange={(event) =>
                updateForm(
                  "firstName",
                  event.target.value
                )
              }
              placeholder="Student first name"
              className="rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-blue-500"
            />

            <input
              value={form.lastName}
              onChange={(event) =>
                updateForm(
                  "lastName",
                  event.target.value
                )
              }
              placeholder="Last name optional"
              className="rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-blue-500"
            />

            <input
              value={form.fatherName}
              onChange={(event) =>
                updateForm(
                  "fatherName",
                  event.target.value
                )
              }
              placeholder="Father name"
              className="rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-blue-500"
            />

            <input
              value={form.dob}
              onChange={(event) =>
                updateForm(
                  "dob",
                  event.target.value
                )
              }
              placeholder="DOB DD/MM/YYYY"
              className="rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-blue-500"
            />

            <input
              value={form.phone}
              onChange={(event) =>
                updateForm(
                  "phone",
                  event.target.value
                )
              }
              placeholder="Mobile number"
              className="rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-blue-500"
            />

            <select
              value={form.gender}
              onChange={(event) =>
                updateForm(
                  "gender",
                  event.target.value
                )
              }
              className="rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-blue-500"
            >
              <option value="">
                Gender
              </option>
              <option value="Male">
                Male
              </option>
              <option value="Female">
                Female
              </option>
              <option value="Other">
                Other
              </option>
            </select>

            <input
              value={form.aadharNo}
              onChange={(event) =>
                updateForm(
                  "aadharNo",
                  event.target.value
                )
              }
              placeholder="Aadhar no optional"
              className="rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-blue-500"
            />

            <select
              value={
                form.aadharVerificationStatus
              }
              onChange={(event) =>
                updateForm(
                  "aadharVerificationStatus",
                  event.target.value
                )
              }
              className="rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-blue-500"
            >
              <option value="">
                Aadhar status optional
              </option>
              <option value="Verified">
                Verified
              </option>
              <option value="Pending">
                Pending
              </option>
              <option value="Not Verified">
                Not Verified
              </option>
            </select>

            <input
              value={
                form.admissionDate
              }
              onChange={(event) =>
                updateForm(
                  "admissionDate",
                  event.target.value
                )
              }
              placeholder="Admission date optional"
              className="rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-blue-500"
            />

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
                  <Image
                    size={16}
                  />
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
                onChange={(event) =>
                  uploadPhoto(
                    event.target.files?.[0]
                  )
                }
              />
            </label>

            <button
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
                py-3
                text-sm
                font-semibold
                text-white
                sm:col-span-2
                ${
                  canSubmit &&
                  !saving
                    ? "bg-orange-500 hover:bg-orange-600"
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
                  <Plus
                    size={18}
                  />
                )
              }
              Add Student
            </button>
          </div>
        ) : (
          <div
            className="
              mt-4
              rounded-2xl
              border
              border-slate-200
              bg-slate-50
              p-4
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
                bg-white
                p-6
                text-center
              "
            >
              {
                importing ? (
                  <LoaderCircle
                    size={26}
                    className="animate-spin text-blue-600"
                  />
                ) : (
                  <Upload
                    size={26}
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
                Upload Excel file
              </span>
              <span
                className="
                  text-xs
                  text-slate-500
                "
              >
                Required columns: Sr no, name of students, father name, DOB, mobile number, gender.
              </span>
              <input
                type="file"
                accept=".xlsx,.xls"
                hidden
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
                  className="
                    mt-4
                    rounded-xl
                    bg-white
                    p-4
                    text-sm
                    text-slate-700
                  "
                >
                  Imported {importResult.created} students. Skipped {importResult.skipped}.
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
                </div>
              )
            }
          </div>
        )
      }

      <div
        className="
          mt-5
          space-y-3
        "
      >
        {
          loading ? (
            <CardListSkeleton />
          ) : students.length === 0 ? (
            <div
              className="
                rounded-2xl
                border
                border-slate-200
                p-4
                text-sm
                text-slate-500
              "
            >
              No students added yet.
            </div>
          ) : (
            students.map(
              (student) => (
                <div
                  key={student.id}
                  className="
                    flex
                    items-center
                    gap-3
                    rounded-2xl
                    border
                    border-slate-200
                    p-3
                  "
                >
                  {
                    student.photoUrl ? (
                      <img
                        src={student.photoUrl}
                        alt={student.fullName}
                        className="
                          h-11
                          w-11
                          rounded-full
                          object-cover
                        "
                      />
                    ) : (
                      <div
                        className="
                          flex
                          h-11
                          w-11
                          items-center
                          justify-center
                          rounded-full
                          bg-blue-100
                          text-sm
                          font-bold
                          text-blue-700
                        "
                      >
                        {
                          getInitials(
                            student
                          )
                        }
                      </div>
                    )
                  }

                  <div
                    className="
                      min-w-0
                      flex-1
                    "
                  >
                    <p
                      className="
                        truncate
                        text-sm
                        font-semibold
                        text-slate-900
                      "
                    >
                      {student.fullName}
                    </p>
                    <p
                      className="
                        mt-1
                        text-xs
                        text-slate-500
                      "
                    >
                      Sr no {student.schoolRegisterNo} · {student.gender} · {student.phone}
                    </p>
                  </div>

                  <User
                    size={18}
                    className="
                      shrink-0
                      text-slate-400
                    "
                  />
                </div>
              )
            )
          )
        }
      </div>
    </div>
  );
}
