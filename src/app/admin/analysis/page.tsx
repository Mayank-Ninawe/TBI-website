"use client";
import React, { useState, useEffect, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LabelList, Cell, RadialBarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, RadialBar, PieChart, Pie, LineChart, Line } from "recharts";
import { motion } from "framer-motion";
import * as XLSX from 'xlsx';
import { TrendingUp, Search, ExternalLink, Download, Filter, ChevronDown, Upload, FileText, BarChart3, Plus } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSearchFilter } from "@/hooks/useSearchFilter";
import { useYearFilter } from "@/hooks/useYearFilter";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, setDoc, doc } from 'firebase/firestore';
import { format } from 'date-fns';
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";

const auth = getAuth();

function useFirebaseAuth() {
  const [user, setUser] = useState<import("firebase/auth").User | null>(null);

  useEffect(() => {
    // Listen for auth state changes
    const unsubscribe = auth.onAuthStateChanged((firebaseUser) => {
      setUser(firebaseUser);
    });

    // Optionally, sign in automatically for testing
    // Removed automatic sign-in to avoid auth/invalid-credential error

    return () => unsubscribe();
  }, []);

  return user;
}

// Accent and theme colors
const BG_DARK = "#121212";
const TEXT_LIGHT = "#E0E0E0";
const ACCENT = "#4F46E5";
const ROW_ALT = "#1E1E1E";

// Types for our data
interface StartupData {
  submissionDate: string;
  status: string;
  currentStep: string;
  name: string;
}

interface ChartData {
  month: string;
  approved: number;
  pending: number;
  rejected: number;
}

interface SuccessData {
  year: string;
  count: number;
}

interface StepData {
  step: string;
  count: number;
}

interface VCInvestment {
  id: string;
  startupName: string;
  amount: number;
  organization: string;
  year: number;
  proofLink: string;
  description: string;
  stage: string;
  sector: string;
  yearDisplay: string;
}

// Add new interface for startup details
interface StartupDetail {
  serialNo: string;
  companyName: string;
  incubationDate: string;
  status: string;
  legalStatus: string;
  year: number;
}

// Add new interface for filter options
interface FilterOptions {
  status: string;
  legalStatus: string;
  dateSort: 'asc' | 'desc' | 'none';
}

// Remove the dummy data for application status
const dummyData = {
  stages: [
    { label: "Ideation", value: 45, category: 'Stages' },
    { label: "MVP", value: 30, category: 'Stages' },
    { label: "Early Traction", value: 15, category: 'Stages' },
    { label: "Growth", value: 10, category: 'Stages' },
  ],
  registrationTypes: [
    { label: "Private Limited", value: 60, category: 'Registration' },
    { label: "LLP", value: 25, category: 'Registration' },
    { label: "Proprietorship", value: 15, category: 'Registration' },
  ],
  sessions: [
    { label: "2023-24", value: 35, category: 'Sessionwise' },
    { label: "2022-23", value: 30, category: 'Sessionwise' },
    { label: "2021-22", value: 25, category: 'Sessionwise' },
    { label: "2020-21", value: 10, category: 'Sessionwise' },
  ],
  vcInvestments: [
    { label: "Seed", value: 40, category: 'VCInvestment' },
    { label: "Series A", value: 30, category: 'VCInvestment' },
    { label: "Pre-seed", value: 20, category: 'VCInvestment' },
    { label: "Series B", value: 10, category: 'VCInvestment' },
  ],
};

// Helper for color coding by category
const categoryColors: Record<string, string> = {
  Status: '#6366F1',
  Stages: '#10B981',
  Registration: '#F59E42',
  Sessionwise: '#FB7185',
  VCInvestment: '#A855F7', // Added color for VCInvestment category
};

function excelDateToString(serial: number) {
  const excelEpoch = new Date(1899, 11, 30);
  const date = new Date(excelEpoch.getTime() + serial * 24 * 60 * 60 * 1000);
  const month = date.toLocaleString('en-US', { month: 'short' });
  const year = date.getFullYear().toString().slice(-2);
  return `${month}-${year}`;
}

function normalizeHeader(str: string) {
  return str
    .replace(/[–—−-]/g, '-') // normalize all dashes to hyphen
    .replace(/\s+/g, ' ') // collapse whitespace
    .trim()
    .toLowerCase();
}

// Helper to convert Excel serial date to JavaScript Date object
function excelDateToJSDate(excelDate: number): Date | null {
  if (typeof excelDate !== 'number' || excelDate <= 0) {
    return null;
  }
  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  // Excel's epoch is Dec 31, 1899, 00:00:00 (Excel's day 0)
  const excelEpoch = new Date(1899, 11, 31).getTime();
  let jsDate = new Date(excelEpoch + excelDate * millisecondsPerDay);

  // Excel's 1900 leap year bug: Excel treats 1900 as a leap year
  // If the date is after Feb 28, 1900 (serial date 60), subtract one day
  // to correct for Excel's incorrect Feb 29, 1900.
  if (excelDate > 60) {
    jsDate = new Date(jsDate.getTime() - millisecondsPerDay);
  }

  return jsDate;
}

// Helper: scan raw sheet cells for summary blocks
function robustParseSummaryBlocks(workbook: XLSX.WorkBook) {
  const blocks: Record<string, { label: string, value: number, category: string }[]> = {};
  for (const sheetName of workbook.SheetNames) {
    console.log(`Processing sheet: ${sheetName} for summary blocks.`);
    const sheet = workbook.Sheets[sheetName];
    const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1:Z100');
    const rows: any[][] = [];
    for (let r = range.s.r; r <= range.e.r; ++r) {
      const row: any[] = [];
      for (let c = range.s.c; c <= range.e.c; ++c) {
        const cellAddress = XLSX.utils.encode_cell({ r, c });
        const cell = sheet[cellAddress];
        row.push(cell ? cell.v : undefined);
      }
      rows.push(row);
    }
    let i = 0;
    while (i < rows.length) {
      let blockCol = -1;
      let blockName = '';
      let category = '';
      for (let c = 0; c < rows[i].length; ++c) {
        if (rows[i][c] && typeof rows[i][c] === 'string' && normalizeHeader(rows[i][c]).includes('startups -')) {
          blockCol = c;
          const rawBlockHeader = rows[i][c];
          if (normalizeHeader(rawBlockHeader).includes('status')) {
            blockName = 'Startups - Status';
            category = 'Status';
          } else {
            blockName = rawBlockHeader.replace(/[:–—−-]/g, '').trim();
            if (blockName.toLowerCase().includes('stages')) category = 'Stages';
            else if (blockName.toLowerCase().includes('registration')) category = 'Registration';
            else if (blockName.toLowerCase().includes('sessionwise')) category = 'Sessionwise';
          }
          break;
        }
      }
      if (blockCol !== -1) {
        const block: { label: string, value: number, category: string }[] = [];
        i++;
        while (i < rows.length) {
          const nextRow = rows[i];
          const isEmptyRow = !nextRow || nextRow.every(cell => cell === undefined || cell === null || cell.toString().trim() === '');
          let isNewBlockHeader = false;
          for (let c = 0; c < nextRow.length; ++c) {
            if (nextRow[c] && typeof nextRow[c] === 'string' && normalizeHeader(nextRow[c]).includes('startups -')) {
              isNewBlockHeader = true;
              break;
            }
          }
          if (isEmptyRow || isNewBlockHeader) break;
          if (nextRow[blockCol] && nextRow[blockCol + 1] !== undefined && nextRow[blockCol + 1] !== null && nextRow[blockCol + 1].toString().trim() !== '') {
            const value = parseInt(nextRow[blockCol + 1]);
            if (!isNaN(value)) block.push({ label: nextRow[blockCol].toString().trim(), value, category });
          }
          i++;
        }
        if (block.length > 0) {
          blocks[blockName] = block;
          console.log(`Added block '${blockName}' with data:`, block);
        }
      } else {
        i++;
      }
    }
  }
  console.log('Final robustParseSummaryBlocks result:', blocks);
  return blocks;
}

// Enhanced custom tooltip for summary chart (now uses category)
const GlassTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const { label, value, category } = payload[0].payload; // Destructure category
    return (
      <div style={{
        background: 'rgba(30,30,40,0.85)',
        color: '#fff',
        borderRadius: 16,
        padding: '18px 22px',
        boxShadow: '0 4px 32px #0008',
        backdropFilter: 'blur(8px)',
        border: `1.5px solid ${categoryColors[category] || '#6366F1'}`,
        minWidth: 120,
        fontSize: 18,
        fontWeight: 600,
        letterSpacing: 0.2,
        transition: 'all 0.2s',
      }}>
        <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>{label}</div>
        {category && <div style={{ color: categoryColors[category] || '#A5B4FC', fontWeight: 500, fontSize: 16 }}>Category: <span style={{ color: '#fff', fontWeight: 700 }}>{category}</span></div>}
        <div style={{ color: '#A5B4FC', fontWeight: 500, fontSize: 16 }}>Value: <span style={{ color: '#fff', fontWeight: 700 }}>{value}</span></div>
      </div>
    );
  }
  return null;
};

// Add a helper to robustly find the summary sheet
function findSummarySheetName(workbook: XLSX.WorkBook): string | null {
  const summaryNames = [
    'summary',
    'incubation summary',
    'incubation',
    'incubation data',
    'incubation overview',
    'incubation report',
    'incubation dashboard',
    'incubation block',
    'summary block',
    'dashboard',
    'overview',
    'report',
  ];
  for (const name of workbook.SheetNames) {
    if (summaryNames.includes(name.trim().toLowerCase())) return name;
  }
  for (const name of workbook.SheetNames) {
    const lower = name.trim().toLowerCase();
    if (summaryNames.some(sn => lower.includes(sn))) return name;
  }
  for (const name of workbook.SheetNames) {
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[name], { header: 1 }) as any[][];
    if (rows.some(row => row[0] && typeof row[0] === 'string' && row[0].toLowerCase().includes('startups - status'))) {
      return name;
    }
  }
  return null;
}

// Helper to group submissions by month
function getMonthlyApplicationCounts(submissions: any[]) {
  const counts: Record<string, number> = {};
  submissions.forEach(sub => {
    let date: Date;
    if (sub.submittedAt?.toDate) {
      date = sub.submittedAt.toDate();
    } else if (typeof sub.submittedAt === 'string' || typeof sub.submittedAt === 'number') {
      date = new Date(sub.submittedAt);
    } else {
      return;
    }
    if (isNaN(date.getTime())) return;
    const month = format(date, 'yyyy-MM');
    counts[month] = (counts[month] || 0) + 1;
  });
  // Sort by month ascending
  return Object.entries(counts)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, count]) => ({ month, count }));
}

// Upload parsed Excel data to Firestore
async function uploadExcelDataToFirestore(parsedData: any[]) {
  await addDoc(collection(db, 'analysisUploads'), {
    data: parsedData,
    uploadedAt: new Date(), // Use new Date() instead of serverTimestamp()
  });
}

// Helper: Fetch all campus and off-campus submissions and merge them
async function fetchAndMergeSubmissionsToAnalysis() {
  // Fetch campus submissions
  const campusSnapshot = await getDocs(collection(db, 'contactSubmissions'));
  const campusData = campusSnapshot.docs.map(doc => ({
    ...doc.data(),
    id: doc.id,
    source: 'campus',
  }));

  // Fetch off-campus submissions
  const offCampusSnapshot = await getDocs(collection(db, 'offCampusApplications'));
  const offCampusData = offCampusSnapshot.docs.map(doc => ({
    ...doc.data(),
    id: doc.id,
    source: 'off-campus',
  }));

  // Merge both
  const allSubmissions = [...campusData, ...offCampusData];

  // Upload/merge to 'analysis' collection (idempotent by submission id)
  const analysisCol = collection(db, 'analysis');
  for (const submission of allSubmissions) {
    await setDoc(doc(analysisCol, submission.id), submission, { merge: true });
  }
}

// Helper: Fetch all analysis data
async function fetchAllAnalysisDataFromCollection() {
  const snapshot = await getDocs(collection(db, 'analysis'));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// Helper for status badge colors
function getStatusBadgeColors(status: string) {
  switch ((status || '').toLowerCase()) {
    case 'revenue generation':
    case 'approved':
    case 'active':
      return 'bg-green-100 text-green-800';
    case 'discontinued':
    case 'rejected':
    case 'exit':
      return 'bg-red-100 text-red-800';
    case 'pending':
    case 'in progress':
      return 'bg-yellow-100 text-yellow-800';
    case 'review':
      return 'bg-blue-100 text-blue-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

// Helper for legal status badge colors
function getLegalStatusBadgeColors(legalStatus: string) {
  switch ((legalStatus || '').toLowerCase()) {
    case 'msme ssi':
      return 'bg-blue-100 text-blue-800';
    case 'llp':
      return 'bg-purple-100 text-purple-800';
    case 'pvt. ltd.':
    case 'private limited':
      return 'bg-indigo-100 text-indigo-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

const AnalysisPage = () => {
  // All hooks at the top, before any return or conditional
  const [mounted, setMounted] = useState(false);
  const user = useFirebaseAuth(); // Use the auth hook
  const [excelData, setExcelData] = useState<StartupData[]>([]);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [successData, setSuccessData] = useState<SuccessData[]>([]);
  const [stepData, setStepData] = useState<StepData[]>([]);
  const [vcData, setVCData] = useState<VCInvestment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedStartup, setSelectedStartup] = useState<VCInvestment | null>(null);
  const [summaryBlocks, setSummaryBlocks] = useState<Record<string, { label: string, value: number, category: string }[]> | null>(null);
  const [noSummaryFound, setNoSummaryFound] = useState(false);
  const [startupDetails, setStartupDetails] = useState<StartupDetail[]>([]);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({ status: 'All', legalStatus: 'All', dateSort: 'none' });
  const [selectedSummaryGraph, setSelectedSummaryGraph] = useState<string>('Startups - Status');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [mergedAnalysisData, setMergedAnalysisData] = useState<any[]>([]);
  const [loadingMerged, setLoadingMerged] = useState(true);
  const [analysisSubmissions, setAnalysisSubmissions] = useState<any[]>([]);
  const [loadingAnalysis, setLoadingAnalysis] = useState(true);
  const [submissionGraphData, setSubmissionGraphData] = useState<{ month: string; Campus: number; OffCampus: number }[]>([]);
  const [loadingSubmissionGraph, setLoadingSubmissionGraph] = useState(true);
  // All custom hooks
  const { searchTerm, setSearchTerm, filteredData: filteredStartupDetails } = useSearchFilter<StartupDetail>(
    startupDetails,
    ['serialNo', 'companyName', 'incubationDate', 'status', 'legalStatus']
  );
  const { filterYear, setFilterYear, years: availableYears, filteredData: yearFilteredStartupDetails } = useYearFilter<StartupDetail>(
    filteredStartupDetails
  );
  // All useMemo hooks
  const maxY = React.useMemo(() => {
    let max = 0;
    submissionGraphData.forEach(d => {
      if (d.Campus > max) max = d.Campus;
      if (d.OffCampus > max) max = d.OffCampus;
    });
    return Math.max(2, Math.ceil((max + 1) / 2) * 2);
  }, [submissionGraphData]);
  const applicationLineData = useMemo(() => getMonthlyApplicationCounts(mergedAnalysisData), [mergedAnalysisData]);
  const filterAndGraphStartupDetails = useMemo(() => {
    let filtered = yearFilteredStartupDetails;
    if (filterOptions.status !== 'All') {
      filtered = filtered.filter((detail) =>
        detail.status.toLowerCase() === filterOptions.status.toLowerCase()
      );
    }
    if (filterOptions.legalStatus !== 'All') {
      filtered = filtered.filter((detail) =>
        detail.legalStatus.toLowerCase() === filterOptions.legalStatus.toLowerCase()
      );
    }
    if (filterOptions.dateSort !== 'none') {
      filtered = [...filtered].sort((a, b) => {
        const dateA = new Date(a.incubationDate);
        const dateB = new Date(b.incubationDate);
        return filterOptions.dateSort === 'asc'
          ? dateA.getTime() - dateB.getTime()
          : dateB.getTime() - dateA.getTime();
      });
    }
    return filtered;
  }, [yearFilteredStartupDetails, filterOptions]);
  const uniqueStatuses = useMemo(() => {
    const statuses = new Set(startupDetails.map(detail => detail.status));
    return ['All', ...Array.from(statuses)].filter(Boolean);
  }, [startupDetails]);
  const uniqueLegalStatuses = useMemo(() => {
    const statuses = new Set(startupDetails.map(detail => detail.legalStatus));
    return ['All', ...Array.from(statuses)].filter(Boolean);
  }, [startupDetails]);

  // All useEffect hooks
  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    async function fetchSubmissionsForGraph() {
      setLoadingSubmissionGraph(true);
      const campusSnapshot = await getDocs(collection(db, 'contactSubmissions'));
      const campusData = campusSnapshot.docs.map(doc => doc.data());
      const offCampusSnapshot = await getDocs(collection(db, 'offCampusApplications'));
      const offCampusData = offCampusSnapshot.docs.map(doc => doc.data());
      console.log('Campus submissions:', campusData);
      console.log('Off-campus submissions:', offCampusData);
      const campusCounts: Record<string, number> = {};
      campusData.forEach(sub => {
        let date: Date;
        if (sub.submittedAt?.toDate) {
          date = sub.submittedAt.toDate();
        } else if (typeof sub.submittedAt === 'string' || typeof sub.submittedAt === 'number') {
          date = new Date(sub.submittedAt);
        } else {
          return;
        }
        if (isNaN(date.getTime())) return;
        const month = format(date, 'MMM');
        campusCounts[month] = (campusCounts[month] || 0) + 1;
      });
      const offCampusCounts: Record<string, number> = {};
      offCampusData.forEach(sub => {
        let date: Date;
        if (sub.submittedAt?.toDate) {
          date = sub.submittedAt.toDate();
        } else if (typeof sub.submittedAt === 'string' || typeof sub.submittedAt === 'number') {
          date = new Date(sub.submittedAt);
        } else {
          return;
        }
        if (isNaN(date.getTime())) return;
        const month = format(date, 'MMM');
        offCampusCounts[month] = (offCampusCounts[month] || 0) + 1;
      });
      const allMonths = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
      ];
      const graphData = allMonths.map(month => ({
        month,
        Campus: campusCounts[month] || 0,
        OffCampus: offCampusCounts[month] || 0
      }));
      console.log('Line graph data:', graphData);
      setSubmissionGraphData(graphData);
      setLoadingSubmissionGraph(false);
    }
    fetchSubmissionsForGraph();
  }, []);

  useEffect(() => {
    async function syncAndFetch() {
      setLoadingAnalysis(true);
      await fetchAndMergeSubmissionsToAnalysis();
      const data = await fetchAllAnalysisDataFromCollection();
      setAnalysisSubmissions(data);
      setLoadingAnalysis(false);
    }
    syncAndFetch();
  }, []);

  // Early returns for loading/auth (after all hooks)
  if (!mounted) return null;

  const handleDownloadTemplate = (templateType: string) => {
    let headers: string[] = [];
    let fileName = "";
    let sheetName = "";

    switch (templateType) {
      case "incubationSummary":
        headers = ["Block Name", "Label", "Value"];
        fileName = "Incubation_Summary_Template.xlsx";
        sheetName = "Incubation Summary";
        break;
      case "vcInvestment":
        headers = [
          "Startup Name",
          "Amount",
          "Organization",
          "Year",
          "Proof Link",
          "Description",
          "Stage",
          "Sector",
        ];
        fileName = "VC_Investment_Template.xlsx";
        sheetName = "VC Investment Details";
        break;
      case "startupDetails":
        headers = [
          "Serial No.",
          "Company Name",
          "Incubation Month-Year",
          "Status",
          "Legal Status",
        ];
        fileName = "Startup_Details_Template.xlsx";
        sheetName = "Startup Details";
        break;
      default:
        // Should not happen if dropdown values are controlled
        alert("Invalid template type selected.");
        return;
    }

    const ws = XLSX.utils.aoa_to_sheet([headers]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, fileName);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user) {
      alert("You must be logged in to upload a file.");
      return;
    }

    setIsLoading(true);
    const file = e.target.files?.[0];
    if (!file) {
      setExcelData([]);
      setVCData([]);
      setSummaryBlocks(null);
      setNoSummaryFound(true);
      setStartupDetails([]);
      setIsLoading(false);
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = event.target?.result;
        if (!data) throw new Error("File data is empty.");

        const workbook = XLSX.read(data, { type: 'array' });
        console.log('File read as ArrayBuffer');
        console.log('Workbook sheets:', workbook.SheetNames);

        const { startupSheet, vcSheet } = findRelevantSheet(workbook);
        console.log('Found sheets (names):', { startupSheet, vcSheet });

        if (startupSheet) {
          console.log('Attempting to parse startup details from sheet:', startupSheet);
          const sheet = workbook.Sheets[startupSheet];
          const parsedDetails = parseStartupDetails(sheet);
          setStartupDetails(parsedDetails);
          await uploadExcelDataToFirestore(parsedDetails);
          const all = await fetchAllAnalysisDataFromCollection();
          setAnalysisSubmissions(all);
          console.log('Parsed startup details:', parsedDetails);
          console.log('Startup Details array length after parsing:', parsedDetails.length);
        } else {
          console.warn('Startup Details sheet not found.');
          setStartupDetails([]);
        }

        const summarySheetName = findSummarySheetName(workbook);
        console.log('Found summary sheet name:', summarySheetName);

        if (vcSheet) {
          console.log('Attempting to parse VC data from sheet:', vcSheet);
          const sheet = workbook.Sheets[vcSheet];
          const rawVCData = XLSX.utils.sheet_to_json(sheet) as any[];
          const parsedVCData = normalizeVCData(rawVCData);
          setVCData(parsedVCData);
          console.log('Parsed VC data:', parsedVCData);
        } else {
          console.warn('VC Investment sheet not found.');
          setVCData([]);
        }

        if (summarySheetName) {
          console.log('Attempting to parse summary blocks...');
          const sheet = workbook.Sheets[summarySheetName];
          const parsedSummaryBlocks = robustParseSummaryBlocks(workbook);
          setSummaryBlocks(parsedSummaryBlocks);
          console.log('Parsed summary blocks and set state:', parsedSummaryBlocks);
          setNoSummaryFound(false);
        } else {
          console.warn('Summary sheet not found. Displaying dummy summary data.');
          setSummaryBlocks(dummyData);
          setNoSummaryFound(true);
        }

      } catch (error) {
        console.error("Error processing Excel file:", error);
        alert("Failed to process Excel file. Please check the console for details.");
        setExcelData([]);
        setVCData([]);
        setSummaryBlocks(dummyData);
        setNoSummaryFound(true);
        setStartupDetails([]);
      } finally {
        setIsLoading(false);
        // Set default selected graph after file upload
        setSelectedSummaryGraph('Startups - Status');
        console.log('setSelectedSummaryGraph called with:', 'Startups - Status');
        console.log('Current summaryBlocks state after setting default graph (might lag):', summaryBlocks);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const findRelevantSheet = (workbook: XLSX.WorkBook): { startupSheet: string | null; vcSheet: string | null } => {
    let startupSheetName: string | null = null;
    let vcSheetName: string | null = null;

    // Prioritize 'Details' for startup data
    if (workbook.SheetNames.includes('Details')) {
      startupSheetName = 'Details';
    } else {
      // Fallback to fuzzy search if 'Details' not found
      const lowerCaseSheetNames = workbook.SheetNames.map(name => name.toLowerCase());
      const possibleStartupSheetNames = ['details', 'startupdata', 'startup details', 'incubation details'];
      for (const name of possibleStartupSheetNames) {
        const foundName = lowerCaseSheetNames.find(sn => sn.includes(name));
        if (foundName) {
          startupSheetName = workbook.SheetNames[lowerCaseSheetNames.indexOf(foundName)];
          break;
        }
      }
    }

    // Prioritize 'VC Invst' for VC data
    if (workbook.SheetNames.includes('VC Invst')) {
      vcSheetName = 'VC Invst';
    } else {
      // Fallback to fuzzy search if 'VC Invst' not found
      const lowerCaseSheetNames = workbook.SheetNames.map(name => name.toLowerCase());
      const possibleVcSheetNames = ['vc invst', 'vc investment', 'investment', 'funding'];
      for (const name of possibleVcSheetNames) {
        const foundName = lowerCaseSheetNames.find(sn => sn.includes(name));
        if (foundName) {
          vcSheetName = workbook.SheetNames[lowerCaseSheetNames.indexOf(foundName)];
          break;
        }
      }
    }

    return { startupSheet: startupSheetName, vcSheet: vcSheetName };
  };

  const normalizeData = (data: any[]): StartupData[] => {
    return data.map(row => {
      // Find the correct column names by matching case-insensitive
      const submissionDateKey = Object.keys(row).find(key => 
        key.toLowerCase().includes('submissiondate') || 
        key.toLowerCase().includes('date')
      );
      
      const statusKey = Object.keys(row).find(key => 
        key.toLowerCase().includes('status')
      );
      
      const currentStepKey = Object.keys(row).find(key => 
        key.toLowerCase().includes('currentstep') || 
        key.toLowerCase().includes('step')
      );
      
      const nameKey = Object.keys(row).find(key => 
        key.toLowerCase().includes('name') || 
        key.toLowerCase().includes('startup')
      );

      return {
        submissionDate: row[submissionDateKey || ''] || new Date().toISOString(),
        status: (row[statusKey || ''] || '').toString(),
        currentStep: (row[currentStepKey || ''] || 'Applied').toString(),
        name: (row[nameKey || ''] || 'Unknown').toString()
      };
    });
  };

  const normalizeVCData = (data: any[]): VCInvestment[] => {
    console.log('Starting VC data normalization with raw data:', data);

    if (!data || data.length === 0) {
      console.warn('No VC data found');
      return [];
    }

    // The first object in the array contains the actual header names as its values,
    // and its keys are the generic '__EMPTY' or 'VC investment'.
    const headerRowObject = data[0];
    console.log('VC Header Row Object:', headerRowObject);

    // Create a mapping from our desired column names to the actual keys (e.g., '__EMPTY')
    const columnKeyMap: Record<string, string> = {};
    const normalizedHeaders = Object.entries(headerRowObject).map(([key, value]) => ({ key, normalizedValue: String(value || '').trim().toLowerCase() }));

    console.log('Normalized Headers from first row values:', normalizedHeaders);

    const findMapping = (aliases: string[]): string | undefined => {
      for (const alias of aliases) {
        const normalizedAlias = alias.trim().toLowerCase();
        const found = normalizedHeaders.find(h => h.normalizedValue === normalizedAlias);
        if (found) return found.key;
      }
      return undefined;
    };

    const startupNameActualKey = findMapping(['name of start ups', 'startup name', 'company name', 'startup company', 'startup']);
    const amountActualKey = findMapping(['amount received', 'amount', 'investment amount', 'funding amount', 'investment']);
    const organizationActualKey = findMapping(['organisation name', 'organization name', 'investor name', 'vc name', 'investor']);
    const yearActualKey = findMapping(['year of receiving vc investment (2020-21 to 2022-23)', 'year of receiving vc investment', 'investment year', 'year', 'date', 'investment date']);
    const proofLinkActualKey = findMapping(['proof link', 'proof', 'document link', 'link']);

    console.log('Mapped VC column actual keys:', {
      startupNameActualKey,
      amountActualKey,
      organizationActualKey,
      yearActualKey,
      proofLinkActualKey
    });

    // Process the data rows (skip the first row which contained header values)
    const processedData = data.slice(1).map((row, index) => {
      // Parse amount (lakhs, CR, etc)
      let amount = 0;
      const amountStr = amountActualKey && row[amountActualKey] !== undefined ? String(row[amountActualKey]).toLowerCase() : '0';
      if (amountStr.includes('cr')) {
        amount = parseFloat(amountStr.replace(/[^0-9.]/g, '')) * 10000000;
      } else if (amountStr.includes('lakh')) {
        amount = parseFloat(amountStr.replace(/[^0-9.]/g, '')) * 100000;
      } else {
        amount = parseFloat(amountStr.replace(/[^0-9.]/g, '')) || 0;
      }

      // Parse year
      let yearDisplay = '';
      const rawYearValue = yearActualKey && row[yearActualKey] !== undefined ? row[yearActualKey] : undefined;

      console.log(`Raw year value for VC investment (row ${index + 1}): ${rawYearValue}`);
      if (typeof rawYearValue === 'number') {
        yearDisplay = excelDateToString(rawYearValue);
        console.log(`Converted Excel date ${rawYearValue} to: ${yearDisplay}`);
      } else if (typeof rawYearValue === 'string') {
        yearDisplay = rawYearValue.trim();
        console.log(`Trimmed string year: ${yearDisplay}`);
      } else {
        yearDisplay = '';
        console.log(`No valid year found for row ${index + 1}, setting to empty string.`);
      }

      const investment = {
        id: `vc-${index}`,
        startupName: startupNameActualKey && row[startupNameActualKey] !== undefined ? String(row[startupNameActualKey]).trim() : 'Unknown Startup',
        amount: amount,
        organization: organizationActualKey && row[organizationActualKey] !== undefined ? String(row[organizationActualKey]).trim() : 'Unknown Organization',
        year: new Date().getFullYear(), // Placeholder, yearDisplay is used for display
        yearDisplay,
        proofLink: proofLinkActualKey && row[proofLinkActualKey] !== undefined ? String(row[proofLinkActualKey]).trim() : '',
        description: '',
        stage: '',
        sector: ''
      };

      console.log('Processed VC row:', investment);
      return investment;
    }).filter(investment => 
      investment.startupName !== 'Unknown Startup' && 
      investment.amount > 0
    );

    console.log('Final processed VC data:', processedData);
    return processedData;
  };

  const processExcelData = (data: StartupData[]) => {
    try {
      // Process data by month and status
      const monthlyData = data.reduce((acc: { [key: string]: { approved: number; pending: number; rejected: number } }, curr) => {
        const date = new Date(curr.submissionDate);
        if (isNaN(date.getTime())) {
          console.warn('Invalid date:', curr.submissionDate);
          return acc;
        }

        const month = date.toLocaleString('default', { month: 'long' });
        if (!acc[month]) {
          acc[month] = { approved: 0, pending: 0, rejected: 0 };
        }
        
        const status = (curr.status || '').toLowerCase();
        switch (status) {
          case 'approved':
          case 'approve':
          case 'accepted':
            acc[month].approved++;
            break;
          case 'pending':
          case 'in progress':
          case 'review':
            acc[month].pending++;
            break;
          case 'rejected':
          case 'reject':
          case 'declined':
            acc[month].rejected++;
            break;
          default:
            acc[month].pending++; // Default to pending for unknown statuses
        }
        return acc;
      }, {});

      const newChartData = Object.entries(monthlyData).map(([month, counts]) => ({
        month,
        ...counts
      }));

      // Process successful startups by year
      const successfulByYear = data.reduce((acc: { [key: string]: number }, curr) => {
        if (curr.status === 'Approved') {
          const year = new Date(curr.submissionDate).getFullYear().toString();
          acc[year] = (acc[year] || 0) + 1;
        }
        return acc;
      }, {});

      const newSuccessData = Object.entries(successfulByYear).map(([year, count]) => ({
        year,
        count,
      }));

      // Process startups by step
      const steps = ['Applied', 'Reviewed', 'Interview', 'Approved', 'Rejected'];
      const stepCounts = data.reduce((acc: { [key: string]: number }, curr) => {
        const step = curr.currentStep || 'Applied';
        acc[step] = (acc[step] || 0) + 1;
        return acc;
      }, {});

      const newStepData = steps.map(step => ({
        step,
        count: stepCounts[step] || 0,
      }));

      setChartData(newChartData);
      setSuccessData(newSuccessData);
      setStepData(newStepData);
    } catch (error) {
      console.error('Error processing data:', error);
      alert('Error processing data. Please check the Excel file format.');
    }
  };

  const parseStartupDetails = (sheet: XLSX.WorkSheet): StartupDetail[] => {
    console.log('Starting to parse startup details...');

    // Read the sheet as a raw array of arrays to find the actual header row
    const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
    console.log('Raw sheet data for header detection:', rawData);

    if (!rawData || rawData.length === 0) {
      console.log('No raw data found in sheet.');
      return [];
    }

    let headerRowIndex = -1;
    let headers: string[] = [];
    const searchKeywords = [
      'startup company name',
      'month/year of incubation status',
      'status',
      'legal status',
      'funnel source',
      'incubation date',
      'company name',
      'current status',
      'all sn',
      'active sn',
    ];

    // Iterate through the first few rows (e.g., first 10) to find the header row
    for (let r = 0; r < Math.min(rawData.length, 10); r++) {
      const currentRow = rawData[r];
      if (Array.isArray(currentRow)) {
        const lowerCaseRow = currentRow.map(cell => String(cell || '').toLowerCase());
        // Check if this row contains a good number of our keywords
        const matchedKeywords = searchKeywords.filter(keyword => lowerCaseRow.some(cell => cell.includes(keyword))).length;
        if (matchedKeywords >= 2) { // Require at least 2 matching keywords to identify as header row
          headerRowIndex = r;
          headers = currentRow.map(cell => String(cell || '').trim());
          console.log(`Identified header row at index ${headerRowIndex}:`, headers);
          break;
        }
      }
    }

    if (headerRowIndex === -1) {
      console.warn('Could not identify a clear header row in the first 10 rows.');
      return [];
    }

    // Helper to find the exact column name from aliases
    const findColumnIndex = (aliases: string[], headers: string[]): number => {
      for (const alias of aliases) {
        const normalizedAlias = normalizeHeader(alias);
        for (let i = 0; i < headers.length; i++) {
          const normalizedHeader = normalizeHeader(headers[i]);
          console.log(`  Comparing normalized alias \'${normalizedAlias}\' with normalized header \'${normalizedHeader}\' (raw: \'${headers[i]}\')`);
          if (normalizedHeader === normalizedAlias) {
            return i; // Return the 0-indexed column index
          }
        }
      }
      return -1; // Return -1 if no matching column found
    };

    // Define possible aliases for each column (order matters for prioritization)
    const serialNoAliases = ['All SN', 'ActiveSN', 'S. No.', 'SN', 'Serial No.'];
    const companyNameAliases = ['Startup Company', 'Startup Company Name', 'Company Name', 'Startup Name', 'Project Name', 'Funnel Source'];
    const incubationDateAliases = ['Month Year of Incubation', 'Month/Year of Incubation Status', 'Incubation Status', 'Incubation Date', 'Date of Incubation', 'Start Date', 'Commencement Date'];
    const statusAliases = ['Status', 'Current Status']; // For the new 'status' field
    const legalStatusAliases = ['Legal Status', 'Legal_Status', 'Registration Status']; // For the 'legalStatus' field

    const serialNoColIndex = findColumnIndex(serialNoAliases, headers);
    const companyNameColIndex = findColumnIndex(companyNameAliases, headers);
    const incubationDateColIndex = findColumnIndex(incubationDateAliases, headers);
    const statusColIndex = findColumnIndex(statusAliases, headers);
    const legalStatusColIndex = findColumnIndex(legalStatusAliases, headers);

    console.log('Mapped Columns (by index):');
    console.log('  Serial No. Column Index:', serialNoColIndex);
    console.log('  Company Name Column Index:', companyNameColIndex);
    console.log('  Incubation Date Column Index:', incubationDateColIndex);
    console.log('  Status Column Index:', statusColIndex);
    console.log('  Legal Status Column Index:', legalStatusColIndex);

    const details: StartupDetail[] = [];

    // Start processing data from the row *after* the identified header row
    for (let i = headerRowIndex + 1; i < rawData.length; i++) {
      const currentRow = rawData[i];
      if (!Array.isArray(currentRow)) continue; // Ensure it's an array

      // Log the raw row data for debugging
      console.log(`Processing row ${i + 1} (raw):`, currentRow);

      // Skip if no relevant data in the identified key columns
      if (serialNoColIndex === -1 && companyNameColIndex === -1 && incubationDateColIndex === -1 && statusColIndex === -1 && legalStatusColIndex === -1) {
        console.log(`Skipping row ${i + 1}: No relevant columns identified in headers or no data in this row.`);
        continue;
      }
      
      // Skip row if primary identifier (companyName or serialNo) is empty
      const serialNoValue = serialNoColIndex !== -1 ? String(currentRow[serialNoColIndex] || '').trim() : '';
      const companyNameValue = companyNameColIndex !== -1 ? String(currentRow[companyNameColIndex] || '').trim() : '';
      if ((serialNoColIndex !== -1 && serialNoValue === '') && (companyNameColIndex !== -1 && companyNameValue === '')) {
        console.log(`Skipping row ${i + 1}: Serial No. and Company Name are empty.`);
        continue;
      }
      console.log(`  Row ${i + 1} - Serial No. raw: ${currentRow[serialNoColIndex]}, parsed: ${serialNoValue}`);
      console.log(`  Row ${i + 1} - Company Name raw: ${currentRow[companyNameColIndex]}, parsed: ${companyNameValue}`);

      let incubationDateValue = 'N/A';
      let yearValue: number = 0;

      if (incubationDateColIndex !== -1 && currentRow[incubationDateColIndex] !== undefined && currentRow[incubationDateColIndex] !== null) {
        if (typeof currentRow[incubationDateColIndex] === 'number') {
          const date = excelDateToJSDate(currentRow[incubationDateColIndex]);
          if (date) {
            incubationDateValue = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
            yearValue = date.getFullYear();
          } else {
            console.warn(`Could not convert Excel date number ${currentRow[incubationDateColIndex]} to date in row ${i + 1}.`);
          }
        } else {
          incubationDateValue = String(currentRow[incubationDateColIndex]).trim();
          const match = incubationDateValue.match(/\d{2}$/);
          let parsedYear = NaN;
          if (match) {
            parsedYear = parseInt(`20${match[0]}`, 10);
          } else {
            const date = new Date(incubationDateValue);
            if (!isNaN(date.getTime())) {
              parsedYear = date.getFullYear();
            }
          }
          yearValue = isNaN(parsedYear) ? 0 : parsedYear;
        }
      }
      console.log(`  Row ${i + 1} - Incubation Date raw: ${currentRow[incubationDateColIndex]}, parsed: ${incubationDateValue}`);
      console.log(`  Row ${i + 1} - Year parsed: ${yearValue}`);

      let statusValue = statusColIndex !== -1 ? String(currentRow[statusColIndex] || 'N/A').trim() : 'N/A';
      console.log(`  Row ${i + 1} - Status raw: ${currentRow[statusColIndex]}, parsed: ${statusValue}`);

      let legalStatusValue = legalStatusColIndex !== -1 ? String(currentRow[legalStatusColIndex] || 'N/A').trim() : 'N/A';
      console.log(`  Row ${i + 1} - Legal Status raw: ${currentRow[legalStatusColIndex]}, parsed: ${legalStatusValue}`);

      const detail: StartupDetail = {
        serialNo: serialNoValue === '' ? 'N/A' : serialNoValue,
        companyName: companyNameValue === '' ? 'N/A' : companyNameValue,
        incubationDate: incubationDateValue,
        status: statusValue,
        legalStatus: legalStatusValue,
        year: yearValue
      };

      // If all key fields are N/A, skip this row as it likely contains no meaningful data
      if (detail.serialNo === 'N/A' && detail.companyName === 'N/A' && detail.incubationDate === 'N/A' && detail.status === 'N/A' && detail.legalStatus === 'N/A') {
          console.log(`Skipping row ${i + 1}: All identified fields are 'N/A'.`);
          continue;
      }

      console.log('Created detail for row', i + 1, ':', detail);
      details.push(detail);
    }

    console.log('Final parsed details:', details);
    return details;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* 2. Header Card */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-8 flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div className="flex items-center gap-4 mb-4 md:mb-0">
            <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center shadow">
              <BarChart3 className="w-7 h-7 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Startup Analysis Dashboard</h2>
              <p className="text-gray-500">Visualize, filter, and analyze startup performance and investments</p>
            </div>
          </div>
          <div className="flex gap-4">
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl shadow transition flex items-center gap-2"
              onClick={() => document.getElementById('excel-upload')?.click()}
            >
              <Upload className="h-5 w-5" /> Upload Data
            </Button>
            <input
              id="excel-upload"
              type="file"
              accept=".xlsx, .xls"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Select value={selectedTemplate} onValueChange={(value) => { setSelectedTemplate(value); handleDownloadTemplate(value); }}>
              <SelectTrigger className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-xl shadow transition flex items-center gap-2 border-0">
                <Download className="h-5 w-5" /> Download Templates
              </SelectTrigger>
              <SelectContent className="bg-white border border-gray-200 shadow-xl rounded-xl">
                <SelectItem value="incubationSummary" className="hover:bg-gray-50 rounded-lg">Incubation Summary</SelectItem>
                <SelectItem value="vcInvestment" className="hover:bg-gray-50 rounded-lg">VC Investment Details</SelectItem>
                <SelectItem value="startupDetails" className="hover:bg-gray-50 rounded-lg">Startup Details</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        {/* 3. Chart Card */}
        <Card className="bg-white border border-gray-200 shadow-md rounded-2xl mb-10">
          <CardContent className="bg-white p-8">
            <h1 className="text-3xl font-extrabold text-gray-900 mb-6 tracking-tight text-center">Average monthly startup submissions</h1>
            {loadingSubmissionGraph ? (
              <div className="h-[300px] flex items-center justify-center text-blue-500">Loading...</div>
            ) : submissionGraphData.every(d => d.Campus === 0 && d.OffCampus === 0) ? (
              <div className="h-[300px] flex items-center justify-center text-gray-400 text-lg font-semibold">No startup submission data available for any month.</div>
            ) : (
              <ResponsiveContainer width="100%" height={450}>
                <LineChart data={submissionGraphData} margin={{ top: 50, right: 30, left: 10, bottom: 10 }}>
                  <CartesianGrid stroke="#bdbdbd" strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fill: '#222', fontSize: 15, fontWeight: 600 }} axisLine={{ stroke: '#bdbdbd' }} />
                  <YAxis
                    allowDecimals={false}
                    domain={[0, maxY + 2]}
                    ticks={Array.from({ length: (maxY + 2) / 2 + 1 }, (_, i) => i * 2)}
                    tick={{ fill: '#222', fontSize: 15, fontWeight: 600 }}
                    axisLine={{ stroke: '#bdbdbd' }}
                    width={50}
                  />
                  <Tooltip
                    contentStyle={{ background: '#fff', borderRadius: 8, border: '1px solid #e5e7eb', color: '#1f2937', fontSize: 14, boxShadow: '0 4px 16px #0001' }}
                    itemStyle={{ color: '#1f2937', fontWeight: 500 }}
                    cursor={{ fill: '#f3f4f6' }}
                  />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    iconType="plainline"
                    wrapperStyle={{
                      background: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: 12,
                      padding: '8px 18px',
                      marginLeft: 12,
                      marginTop: 0,
                      fontWeight: 600,
                      fontSize: 16,
                      right: 30,
                      top: 40, // Move legend bar up
                      position: 'absolute'
                    }}
                  />
                  <Line type="monotone" dataKey="Campus" name="Campus" stroke="#ff9800" strokeWidth={4} dot={{ r: 6, fill: '#fff', stroke: '#ff9800', strokeWidth: 3 }} activeDot={{ r: 8 }} />
                  <Line type="monotone" dataKey="OffCampus" name="Off Campus" stroke="#e91e63" strokeWidth={4} dot={{ r: 6, fill: '#fff', stroke: '#e91e63', strokeWidth: 3 }} activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        {/* 4. Summary Section */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-8 mb-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-6">
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-gray-900">Performance Overview</h2>
              <p className="text-gray-500">Track and analyze startup metrics by category</p>
            </div>
            <div className="relative min-w-[280px]">
              <select
                value={selectedSummaryGraph}
                onChange={(e) => setSelectedSummaryGraph(e.target.value)}
                className="w-full appearance-none bg-white border border-gray-300 text-gray-900 py-3 pl-4 pr-12 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 font-medium shadow-sm"
              >
                {Object.keys(summaryBlocks || dummyData).map((key) => (
                  <option key={key} value={key}>
                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-gray-500">
                <ChevronDown className="h-5 w-5" />
              </div>
            </div>
          </div>
        </div>
        {/* 5. Tables Section */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-8 mb-10">
          <h2 className="text-xl font-bold text-gray-900 mb-6">VC Investment Details</h2>
          <div className="overflow-x-auto rounded-xl">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-4 px-6 text-gray-900 font-semibold text-sm uppercase tracking-wide">Startup Name</th>
                  <th className="text-left py-4 px-6 text-gray-900 font-semibold text-sm uppercase tracking-wide">Amount</th>
                  <th className="text-left py-4 px-6 text-gray-900 font-semibold text-sm uppercase tracking-wide">Organization</th>
                  <th className="text-left py-4 px-6 text-gray-900 font-semibold text-sm uppercase tracking-wide">Investment Year</th>
                  <th className="text-left py-4 px-6 text-gray-900 font-semibold text-sm uppercase tracking-wide">Proof Link</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {vcData.map((investment, index) => (
                  <tr key={investment.id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors`}>
                    <td className="py-4 px-6 text-gray-900 font-medium">
                      {investment.startupName && investment.startupName.trim() !== '' ? investment.startupName : <span className="text-gray-400">—</span>}
                    </td>
                    <td className="py-4 px-6 text-blue-600 font-bold text-lg">
                      {investment.amount > 0 ? formatAmount(investment.amount) : <span className="text-gray-400">—</span>}
                    </td>
                    <td className="py-4 px-6 text-gray-900">
                      {investment.organization && investment.organization.trim() !== '' ? investment.organization : <span className="text-gray-400">—</span>}
                    </td>
                    <td className="py-4 px-6 text-gray-900">
                      {investment.yearDisplay && investment.yearDisplay.trim() !== '' ? investment.yearDisplay : <span className="text-gray-400">—</span>}
                    </td>
                    <td className="py-4 px-6">
                      {investment.proofLink && investment.proofLink.trim() !== '' ? (
                        <a
                          href={investment.proofLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 transition-colors inline-flex items-center font-medium"
                        >
                          View Proof <ExternalLink className="ml-1 w-4 h-4" />
                        </a>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Startup Details</h2>
          <div className="mb-6 grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Search Bar */}
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search startups..."
                className="w-full p-3 pl-10 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <Search className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
            </div>
            {/* Status Filter */}
            <div className="relative">
              <select
                value={filterOptions.status}
                onChange={(e) => setFilterOptions(prev => ({ ...prev, status: e.target.value }))}
                className="w-full p-3 pl-10 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
              >
                {uniqueStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
              <Filter className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
            </div>
            {/* Legal Status Filter */}
            <div className="relative">
              <select
                value={filterOptions.legalStatus}
                onChange={(e) => setFilterOptions(prev => ({ ...prev, legalStatus: e.target.value }))}
                className="w-full p-3 pl-10 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
              >
                {uniqueLegalStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
              <Filter className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
            </div>
            {/* Year Filter */}
            <div className="relative">
              <select
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value === "all" ? "all" : parseInt(e.target.value, 10))}
                className="w-full p-3 pl-10 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
              >
                <option value="all">All Years</option>
                {availableYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
              <Filter className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
            {/* Date Sort */}
            <div className="relative">
              <select
                value={filterOptions.dateSort}
                onChange={(e) => setFilterOptions(prev => ({ ...prev, dateSort: e.target.value as 'asc' | 'desc' | 'none' }))}
                className="w-full p-3 pl-10 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
              >
                <option value="none">Sort by Date</option>
                <option value="asc">Oldest First</option>
                <option value="desc">Newest First</option>
              </select>
              <TrendingUp className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left py-4 px-6 text-gray-900 font-semibold text-sm uppercase tracking-wide">Serial No.</th>
                  <th className="text-left py-4 px-6 text-gray-900 font-semibold text-sm uppercase tracking-wide">Company Name</th>
                  <th className="text-left py-4 px-6 text-gray-900 font-semibold text-sm uppercase tracking-wide">Incubation Date</th>
                  <th className="text-left py-4 px-6 text-gray-900 font-semibold text-sm uppercase tracking-wide">Status</th>
                  <th className="text-left py-4 px-6 text-gray-900 font-semibold text-sm uppercase tracking-wide">Legal Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filterAndGraphStartupDetails.length > 0 ? (
                  filterAndGraphStartupDetails.map((detail, index) => (
                    <tr key={index} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors`}>
                      <td className="py-4 px-6 text-gray-900">
                        {detail.serialNo && detail.serialNo.trim() !== 'N/A' ? detail.serialNo : <span className="text-gray-400">—</span>}
                      </td>
                      <td className="py-4 px-6 text-gray-900 font-medium">
                        {detail.companyName && detail.companyName.trim() !== 'N/A' ? detail.companyName : <span className="text-gray-400">—</span>}
                      </td>
                      <td className="py-4 px-6 text-gray-600">
                        {detail.incubationDate && detail.incubationDate.trim() !== 'N/A' ? detail.incubationDate : <span className="text-gray-400">—</span>}
                      </td>
                      <td className="py-4 px-6">
                        {detail.status && detail.status.trim() !== 'N/A' ? (
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColors(detail.status)}`}>
                            {detail.status}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        {detail.legalStatus && detail.legalStatus.trim() !== 'N/A' ? (
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getLegalStatusBadgeColors(detail.legalStatus)}`}>
                            {detail.legalStatus}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-500">No startup details found matching the filters.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        {/* Professional Modal */}
        {selectedStartup && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl"
            >
              <Card className="bg-white border border-gray-200 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold text-gray-900">{selectedStartup.startupName}</CardTitle>
                  <CardDescription className="text-gray-600">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mr-2 ${getStatusBadgeColors(selectedStartup.stage)}`}>
                      {selectedStartup.stage}
                    </span>
                    {selectedStartup.sector}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-sm font-medium text-gray-600 mb-2">Investment Details</h3>
                      <p className="text-3xl font-bold text-blue-600">
                        {formatAmount(selectedStartup.amount)}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-600 mb-2">Organization</h3>
                      <p className="text-gray-900">{selectedStartup.organization || ''}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-600 mb-2">Description</h3>
                      <p className="text-gray-700 leading-relaxed">{selectedStartup.description || ''}</p>
                    </div>
                    {selectedStartup.proofLink && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-600 mb-2">Proof Link</h3>
                        <a
                          href={selectedStartup.proofLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
                        >
                          View Proof <ExternalLink className="h-4 w-4" />
                        </a>
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="border-t border-gray-200">
                  <button
                    onClick={() => setSelectedStartup(null)}
                    className="ml-auto px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-lg transition-colors"
                  >
                    Close
                  </button>
                </CardFooter>
              </Card>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalysisPage;
