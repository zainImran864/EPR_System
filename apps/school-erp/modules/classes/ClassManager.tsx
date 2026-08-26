"use client";

import React, { useState } from "react";
import { BookOpen, Plus, Users, School, Layers, DoorClosed } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";

export interface ClassSection {
  id: string;
  name: string;
  roomNumber: string;
  classTeacher: string;
  studentCount: number;
}

export interface ClassGrade {
  id: string;
  name: string;
  numericGrade: number;
  academicYear: string;
  totalStudents: number;
  sections: ClassSection[];
}

export const ClassManager: React.FC = () => {
  const [classes, setClasses] = useState<ClassGrade[]>([
    {
      id: "cls-10",
      name: "Grade 10",
      numericGrade: 10,
      academicYear: "2026-2027",
      totalStudents: 58,
      sections: [
        {
          id: "sec-10a",
          name: "Section A",
          roomNumber: "Room 301",
          classTeacher: "Marcus Sterling",
          studentCount: 30,
        },
        {
          id: "sec-10b",
          name: "Section B",
          roomNumber: "Room 302",
          classTeacher: "Sarah Jenkins",
          studentCount: 28,
        },
      ],
    },
    {
      id: "cls-9",
      name: "Grade 9",
      numericGrade: 9,
      academicYear: "2026-2027",
      totalStudents: 62,
      sections: [
        {
          id: "sec-9a",
          name: "Section A",
          roomNumber: "Room 201",
          classTeacher: "David Miller",
          studentCount: 32,
        },
        {
          id: "sec-9b",
          name: "Section B",
          roomNumber: "Room 202",
          classTeacher: "Rachel Adams",
          studentCount: 30,
        },
      ],
    },
  ]);

  const [isAddClassOpen, setIsAddClassOpen] = useState(false);
  const [newClassName, setNewClassName] = useState("");
  const [newClassGrade, setNewClassGrade] = useState("");

  const handleCreateClass = () => {
    if (!newClassName) return;
    const newClass: ClassGrade = {
      id: `cls-${Date.now()}`,
      name: newClassName,
      numericGrade: parseInt(newClassGrade) || 1,
      academicYear: "2026-2027",
      totalStudents: 0,
      sections: [
        {
          id: `sec-${Date.now()}`,
          name: "Section A",
          roomNumber: "Room TBA",
          classTeacher: "Unassigned",
          studentCount: 0,
        },
      ],
    };
    setClasses([...classes, newClass]);
    setNewClassName("");
    setNewClassGrade("");
    setIsAddClassOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#0D9488]" />
            Academic Classes & Sections
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Organize grades, allocate section rooms, and assign faculty leads
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => setIsAddClassOpen(true)}
          className="text-xs"
        >
          Add New Class
        </Button>
      </div>

      {/* Class List Cards */}
      <div className="space-y-6">
        {classes.map((cls) => (
          <Card key={cls.id}>
            <CardHeader className="bg-slate-50/60 flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#CCFBF1] text-[#0D9488] flex items-center justify-center font-bold text-sm">
                  {cls.numericGrade}
                </div>
                <div>
                  <CardTitle className="text-base">{cls.name}</CardTitle>
                  <span className="text-xs text-slate-500">
                    Session: {cls.academicYear}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Badge variant="primary" size="sm" isMono>
                  {cls.totalStudents} Students
                </Badge>
                <Badge variant="neutral" size="sm">
                  {cls.sections.length} Sections
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {cls.sections.map((sec) => (
                  <div
                    key={sec.id}
                    className="p-4 rounded-xl border border-slate-200/80 bg-white hover:border-[#0D9488]/40 hover:shadow-xs transition-all duration-150 flex flex-col justify-between space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-slate-900">
                        {sec.name}
                      </span>
                      <span className="text-xs text-slate-500 flex items-center gap-1 font-mono-data">
                        <DoorClosed className="w-3.5 h-3.5 text-slate-400" />
                        {sec.roomNumber}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                      <div className="flex items-center gap-2">
                        <Avatar name={sec.classTeacher} size="xs" />
                        <span className="text-slate-700 font-medium truncate max-w-[120px]">
                          {sec.classTeacher}
                        </span>
                      </div>

                      <Badge variant="info" size="sm" isMono>
                        {sec.studentCount} enrolled
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add Class Modal */}
      <Modal
        isOpen={isAddClassOpen}
        onClose={() => setIsAddClassOpen(false)}
        title="Create New Academic Grade / Class"
        description="Add a new class to your institution curriculum."
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAddClassOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleCreateClass}>
              Create Class
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Class / Grade Name *"
            placeholder="e.g. Grade 11"
            value={newClassName}
            onChange={(e) => setNewClassName(e.target.value)}
          />
          <Input
            label="Numeric Grade Level *"
            type="number"
            placeholder="e.g. 11"
            value={newClassGrade}
            onChange={(e) => setNewClassGrade(e.target.value)}
          />
        </div>
      </Modal>
    </div>
  );
};

