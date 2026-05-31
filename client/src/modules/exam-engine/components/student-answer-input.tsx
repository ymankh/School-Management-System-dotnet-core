import { useState } from "react"
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { ArrowDown, ArrowUp, FileUp, GripVertical, Upload } from "lucide-react"

import { MarkdownContent } from "@/modules/exam-engine/components/markdown-content"
import type { ExamQuestion, StudentAnswer } from "@/modules/exam-engine/types/exam-engine.types"
import { getMatchPairs, getOrderingAnswer, getQuestionOptions, parseAnswer } from "@/modules/exam-engine/utils/exam-engine-model"
import { Button } from "@/shared/components/ui/button"
import { Input } from "@/shared/components/ui/input"
import { Label } from "@/shared/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/shared/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select"
import { Textarea } from "@/shared/components/ui/textarea"
import { cn } from "@/shared/lib/utils"

export function QuestionAnswerInput({
  answer,
  locked,
  onChangeText,
  onSaveAnswer,
  onUploadFile,
  optionOrder,
  question,
  textAnswer,
}: {
  answer?: StudentAnswer
  locked: boolean
  onChangeText: (value: string) => void
  onSaveAnswer: (questionId: number, answerJson: string, flaggedForReview?: boolean) => Promise<void>
  onUploadFile: (questionId: number, file: File) => Promise<void>
  optionOrder: number[]
  question: ExamQuestion
  textAnswer: string
}) {
  const parsedAnswer = parseAnswer(answer?.answerJson)
  const [uploadState, setUploadState] = useState<"empty" | "uploading" | "uploaded" | "failed" | "replaced" | "removed">("empty")
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [matchingAnswers, setMatchingAnswers] = useState<Record<number, string>>(() => parsedAnswer?.pairs ?? {})
  const [orderingAnswer, setOrderingAnswer] = useState<string[]>(() => getOrderingAnswer(question, parsedAnswer))
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  if (question.type === "MultipleChoice") {
    const orderedOptions = optionOrder.length > 0
      ? optionOrder
          .map((optionId) => getQuestionOptions(question).find((option) => option.id === optionId))
          .filter((option): option is ExamQuestion["options"][number] => Boolean(option))
      : getQuestionOptions(question)

    return (
      <RadioGroup
        aria-label="Multiple choice answer options"
        disabled={locked}
        value={parsedAnswer?.selectedOptionId?.toString() ?? ""}
        onValueChange={(value) => void onSaveAnswer(question.id, JSON.stringify({ selectedOptionId: Number(value) }), answer?.flaggedForReview)}
      >
        {orderedOptions.map((option) => {
          const selected = parsedAnswer?.selectedOptionId === option.id

          return (
            <Label
              key={option.id}
              className={cn(
                "flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-md border bg-background p-3 text-left text-sm font-normal transition hover:bg-muted has-disabled:cursor-not-allowed has-disabled:opacity-50",
                selected && "border-primary bg-primary/10 ring-2 ring-ring ring-offset-2 ring-offset-background",
              )}
            >
              <RadioGroupItem value={option.id.toString()} />
              <MarkdownContent content={option.textMarkdown} />
            </Label>
          )
        })}
      </RadioGroup>
    )
  }

  if (question.type === "TrueFalse") {
    return (
      <RadioGroup
        aria-label="True or false answer options"
        className="flex gap-2"
        disabled={locked}
        value={typeof parsedAnswer?.value === "boolean" ? String(parsedAnswer.value) : ""}
        onValueChange={(value) => void onSaveAnswer(question.id, JSON.stringify({ value: value === "true" }), answer?.flaggedForReview)}
      >
        {[true, false].map((value) => {
          const selected = parsedAnswer?.value === value

          return (
            <Label
              key={String(value)}
              className={cn(
                "flex min-h-11 min-w-24 cursor-pointer justify-center rounded-lg border border-input bg-background px-4 text-sm transition hover:bg-muted has-disabled:cursor-not-allowed has-disabled:opacity-50",
                selected && "border-primary bg-primary text-primary-foreground",
              )}
            >
              <RadioGroupItem className="sr-only" value={String(value)} />
              {value ? "True" : "False"}
            </Label>
          )
        })}
      </RadioGroup>
    )
  }

  if (question.type === "FileUpload") {
    const acceptedTypes = question.fileUploadRule?.acceptedContentTypes ?? []
    const maxSizeBytes = question.fileUploadRule?.maxSizeBytes ?? 0
    const acceptExtensions = acceptedTypes.join(",")
    const canUpload = acceptedTypes.length > 0 && maxSizeBytes > 0
    const currentUploadState = uploadState !== "empty" ? uploadState : parsedAnswer?.state ?? "empty"

    const uploadSelectedFile = (file: File) => {
      setUploadError(null)

      if (!canUpload) {
        setUploadState("failed")
        setUploadError("Upload rules are not configured for this question.")
        return
      }

      if (!acceptedTypes.includes(file.type)) {
        setUploadState("failed")
        setUploadError("This file type is not accepted for this question.")
        return
      }

      if (file.size > maxSizeBytes) {
        setUploadState("failed")
        setUploadError(`File size cannot exceed ${Math.round(maxSizeBytes / 1024 / 1024)}MB.`)
        return
      }

      setUploadState("uploading")
      void onUploadFile(question.id, file)
        .then(() => setUploadState(parsedAnswer?.fileName ? "replaced" : "uploaded"))
        .catch((error: unknown) => {
          setUploadState("failed")
          setUploadError(error instanceof Error ? error.message : "Upload failed. Select the file again.")
        })
    }

    return (
      <div
        className={cn(
          "rounded-md border border-dashed p-6 text-center transition",
          !locked && canUpload && "hover:border-primary hover:bg-muted/40",
        )}
        onDragOver={(event) => {
          if (locked || !canUpload) {
            return
          }

          event.preventDefault()
        }}
        onDrop={(event) => {
          if (locked || !canUpload) {
            return
          }

          event.preventDefault()
          const file = event.dataTransfer.files[0]
          if (file) {
            uploadSelectedFile(file)
          }
        }}
      >
        <Upload className="mx-auto mb-2 size-8 text-muted-foreground" />
        <div className="font-medium">Drag and drop files here or browse</div>
        <div className="mt-1 text-xs text-muted-foreground">
          {canUpload
            ? `Accepted: ${acceptedTypes.join(", ")} • Max ${Math.round(maxSizeBytes / 1024 / 1024)}MB`
            : "Upload rules are not configured for this question."}
        </div>
        <Label className="mt-4 inline-flex h-11 w-fit cursor-pointer items-center justify-center gap-2 rounded-lg border border-input bg-background px-4 text-sm font-medium hover:bg-muted has-disabled:cursor-not-allowed has-disabled:opacity-50">
          <FileUp className="size-4" />
          Choose File
          <input
            accept={acceptExtensions}
            className="sr-only"
            disabled={locked || !canUpload}
            type="file"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (!file) {
                return
              }

              uploadSelectedFile(file)
            }}
          />
        </Label>
        <div aria-live="polite" className="mt-4 rounded-md border bg-muted/40 p-3 text-left text-xs" role="status">
          <div className="font-medium">Upload state: {currentUploadState}</div>
          {parsedAnswer?.fileName && <div className="mt-1 text-muted-foreground">Current file: {parsedAnswer.fileName}</div>}
          {uploadState === "uploading" && <div className="mt-1 text-muted-foreground">Uploading file...</div>}
          {uploadState === "replaced" && <div className="mt-1 text-muted-foreground">Previous file was replaced.</div>}
          {uploadState === "failed" && <div className="mt-1 text-destructive" role="alert">{uploadError ?? "Upload failed. Select the file again."}</div>}
          {parsedAnswer?.fileName && (
            <Button
              className="mt-3"
              disabled={locked}
              size="sm"
              variant="outline"
              onClick={() => {
                setUploadState("removed")
                setUploadError(null)
                void onSaveAnswer(question.id, JSON.stringify({ state: "removed" }), answer?.flaggedForReview)
              }}
            >
              Remove File
            </Button>
          )}
        </div>
      </div>
    )
  }

  if (question.type === "Matching") {
    const matchPairs = getMatchPairs(question)
    const rightValues = matchPairs.map((pair) => pair.rightMarkdown)

    return (
      <div className="space-y-3">
        {matchPairs.map((pair) => (
          <div key={pair.id} className="grid gap-3 rounded-md border p-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <MarkdownContent content={pair.leftMarkdown} />
            <Select
              disabled={locked}
              value={matchingAnswers[pair.id] ?? ""}
              onValueChange={(value) => {
                const next = { ...matchingAnswers, [pair.id]: value }
                setMatchingAnswers(next)
                void onSaveAnswer(question.id, JSON.stringify({ pairs: next }), answer?.flaggedForReview)
              }}
            >
              <SelectTrigger className="h-9 w-full">
                <SelectValue placeholder="Choose match..." />
              </SelectTrigger>
              <SelectContent>
                {rightValues.map((value) => (
                  <SelectItem key={`${pair.id}-${value}`} value={value}>
                    {value.replaceAll("`", "")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}
      </div>
    )
  }

  if (question.type === "Ordering") {
    function saveOrderingAnswer(next: string[]) {
      setOrderingAnswer(next)
      void onSaveAnswer(question.id, JSON.stringify({ items: next }), answer?.flaggedForReview)
    }

    function handleOrderingDragEnd(event: DragEndEvent) {
      const { active, over } = event
      if (!over || active.id === over.id) {
        return
      }

      const oldIndex = orderingAnswer.indexOf(String(active.id))
      const newIndex = orderingAnswer.indexOf(String(over.id))
      if (oldIndex < 0 || newIndex < 0) {
        return
      }

      const next = arrayMove(orderingAnswer, oldIndex, newIndex)
      saveOrderingAnswer(next)
    }

    function moveOrderingItem(index: number, direction: -1 | 1) {
      const targetIndex = index + direction
      if (targetIndex < 0 || targetIndex >= orderingAnswer.length) {
        return
      }

      saveOrderingAnswer(arrayMove(orderingAnswer, index, targetIndex))
    }

    return (
      <DndContext
        collisionDetection={closestCenter}
        sensors={sensors}
        onDragEnd={handleOrderingDragEnd}
      >
        <SortableContext items={orderingAnswer} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {orderingAnswer.map((item, index) => (
              <SortableOrderingItem
                key={item}
                disabled={locked}
                index={index}
                item={item}
                itemCount={orderingAnswer.length}
                onMove={moveOrderingItem}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    )
  }

  if (question.type === "FillInTheBlank") {
    return (
      <Input
        aria-label="Fill in the blank answer"
        disabled={locked}
        placeholder="Type the missing value..."
        value={textAnswer}
        onBlur={() => void onSaveAnswer(question.id, JSON.stringify({ value: textAnswer }), answer?.flaggedForReview)}
        onChange={(event) => onChangeText(event.target.value)}
      />
    )
  }

  return (
    <Textarea
      aria-label="Written answer"
      className="min-h-48"
      disabled={locked}
      placeholder="Type your answer..."
      value={textAnswer}
      onBlur={() => void onSaveAnswer(question.id, JSON.stringify({ value: textAnswer }), answer?.flaggedForReview)}
      onChange={(event) => onChangeText(event.target.value)}
    />
  )
}

function SortableOrderingItem({
  disabled,
  index,
  item,
  itemCount,
  onMove,
}: {
  disabled: boolean
  index: number
  item: string
  itemCount: number
  onMove: (index: number, direction: -1 | 1) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item, disabled })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      className={cn("grid grid-cols-[2rem_minmax(0,1fr)] items-center gap-3", isDragging && "relative z-10 opacity-80")}
      style={style}
    >
      <span className="flex size-8 items-center justify-center rounded-full bg-muted font-mono text-xs font-medium text-muted-foreground">
        {index + 1}
      </span>
      <div
        className={cn(
          "flex items-center gap-3 rounded-md border bg-card p-3 text-sm shadow-sm",
          isDragging && "ring-2 ring-ring",
        )}
      >
        <Button
          aria-label={`Drag to reorder ${item}`}
          className="cursor-grab text-muted-foreground disabled:cursor-not-allowed"
          disabled={disabled}
          size="icon-sm"
          type="button"
          variant="outline"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-4" />
        </Button>
        <span className="min-w-0 flex-1">{item}</span>
        <div className="flex shrink-0 gap-1">
          <Button
            aria-label={`Move ${item} up`}
            disabled={disabled || index === 0}
            size="sm"
            type="button"
            variant="outline"
            onClick={() => onMove(index, -1)}
          >
            <ArrowUp className="size-4" />
          </Button>
          <Button
            aria-label={`Move ${item} down`}
            disabled={disabled || index === itemCount - 1}
            size="sm"
            type="button"
            variant="outline"
            onClick={() => onMove(index, 1)}
          >
            <ArrowDown className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

