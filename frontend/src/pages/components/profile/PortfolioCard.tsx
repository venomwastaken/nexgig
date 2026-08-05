import { ExternalLink, FolderGit2, ImageOff, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { PortfolioItem } from "@/lib/profile";

interface PortfolioCardProps {
    item: PortfolioItem;
    editable?: boolean;
    onEdit?: () => void;
    onDelete?: () => void;
}

export default function PortfolioCard({ item, editable = false, onEdit, onDelete }: PortfolioCardProps) {
    return (
        <Card className="overflow-hidden">
            <div className="flex aspect-video items-center justify-center bg-(--nex-surface-2)">
                {item.imageUrl ? (
                    <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                        }}
                    />
                ) : (
                    <ImageOff size={28} className="text-muted-foreground" />
                )}
            </div>

            <CardContent className="flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                    <h4 className="font-heading text-base font-semibold text-(--nex-text)">
                        {item.title}
                    </h4>
                    {editable && (
                        <div className="flex shrink-0 gap-1">
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                aria-label={`Edit ${item.title}`}
                                onClick={onEdit}
                            >
                                <Pencil size={14} />
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                aria-label={`Delete ${item.title}`}
                                onClick={onDelete}
                                className="text-destructive hover:text-destructive"
                            >
                                <Trash2 size={14} />
                            </Button>
                        </div>
                    )}
                </div>

                <p className="text-sm leading-relaxed text-muted-foreground">{item.description}</p>

                {item.technologies.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                        {item.technologies.map((tech) => (
                            <span key={tech} className="badge badge-neutral">
                                {tech}
                            </span>
                        ))}
                    </div>
                )}

                {(item.githubUrl || item.demoUrl) && (
                    <div className="flex flex-wrap gap-4 pt-1">
                        {item.githubUrl && (
                            <a
                                href={item.githubUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-(--nex-text)"
                            >
                                <FolderGit2 size={14} />
                                Repository
                            </a>
                        )}
                        {item.demoUrl && (
                            <a
                                href={item.demoUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-(--nex-text)"
                            >
                                <ExternalLink size={14} />
                                Live demo
                            </a>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
