"use client";

import React, { useEffect, useState } from "react";
import { 
    CompassOutlined, 
    PlusOutlined, 
    DeleteOutlined, 
    StarOutlined, 
    StarFilled, 
    LoadingOutlined, 
    EnvironmentOutlined,
    CheckOutlined
} from "@ant-design/icons";
import { useToast } from "@/context/ToastContext";

interface IPackage {
    _id: string;
    name: string;
    duration: string;
    destinations: string[];
    includes: string[];
    image: string;
    priceRange: string;
    rating: string;
    isPopular: boolean;
}

export default function AdminPackagesPage() {
    const [packages, setPackages] = useState<IPackage[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showModal, setShowModal] = useState(false);
    
    // Form fields
    const [name, setName] = useState("");
    const [duration, setDuration] = useState("");
    const [priceRange, setPriceRange] = useState("");
    const [destinations, setDestinations] = useState("");
    const [includes, setIncludes] = useState("");
    const [image, setImage] = useState("");

    const { addToast } = useToast();

    const fetchPackages = async () => {
        try {
            const res = await fetch("/api/admin/packages");
            const data = await res.json();
            if (data.error) {
                addToast("error", data.error);
            } else {
                setPackages(data.packages || []);
            }
        } catch {
            addToast("error", "Failed to fetch packages");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPackages();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleCreatePackage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !duration || !priceRange) {
            addToast("error", "Please fill in all mandatory parameters");
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch("/api/admin/packages", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    duration,
                    priceRange,
                    destinations: destinations.split(",").map(s => s.trim()).filter(Boolean),
                    includes: includes.split(",").map(s => s.trim()).filter(Boolean),
                    image: image.trim() || "https://images.unsplash.com/photo-1546708973-b339540b5162?auto=format&fit=crop&w=800&q=80"
                })
            });

            const data = await res.json();
            if (data.error) {
                addToast("error", data.error);
            } else {
                addToast("success", "Package created successfully");
                setShowModal(false);
                // Clear state
                setName("");
                setDuration("");
                setPriceRange("");
                setDestinations("");
                setIncludes("");
                setImage("");
                fetchPackages();
            }
        } catch {
            addToast("error", "Failed to create package");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this package?")) return;

        try {
            const res = await fetch(`/api/admin/packages/${id}`, { method: "DELETE" });
            const data = await res.json();
            if (data.error) {
                addToast("error", data.error);
            } else {
                addToast("success", "Package deleted");
                fetchPackages();
            }
        } catch {
            addToast("error", "Failed to delete package");
        }
    };

    const togglePopular = async (pkg: IPackage) => {
        try {
            const res = await fetch(`/api/admin/packages/${pkg._id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isPopular: !pkg.isPopular })
            });
            const data = await res.json();
            if (data.error) {
                addToast("error", data.error);
            } else {
                addToast("success", `Marked ${pkg.name} as ${!pkg.isPopular ? "Popular" : "Standard"}`);
                fetchPackages();
            }
        } catch {
            addToast("error", "Failed to toggle package highlights");
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight">Packages Database</h1>
                    <p className="text-slate-400 text-sm mt-1">Publish, highlight, or delete dynamic Sri Lankan travel plans.</p>
                </div>
                <button 
                    onClick={() => setShowModal(true)}
                    className="flex items-center justify-center gap-2 bg-brand-primary text-white font-bold px-5 py-2.5 rounded-full shadow-lg shadow-brand-primary/20 hover:scale-105 active:scale-95 transition-all text-sm shrink-0"
                >
                    <PlusOutlined /> Create Package
                </button>
            </div>

            {isLoading ? (
                <div className="py-20 text-center text-slate-500">
                    <LoadingOutlined className="text-2xl text-brand-primary mb-3 block" />
                    Loading Packages List...
                </div>
            ) : packages.length === 0 ? (
                <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-12 text-center">
                    <CompassOutlined className="text-4xl text-slate-500 mb-4 block mx-auto" />
                    <h3 className="text-lg font-bold text-white mb-1">No custom packages created</h3>
                    <p className="text-slate-500 text-xs max-w-sm mx-auto mb-6">
                        Add customized itineraries, set pricing structures, and manage active booking inventories.
                    </p>
                </div>
            ) : (
                <div className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-800 text-slate-500 text-xxs font-black tracking-wider uppercase bg-slate-950/20">
                                    <th className="py-4 px-6">Tour Package</th>
                                    <th className="py-4 px-6">Duration</th>
                                    <th className="py-4 px-6">Price Range</th>
                                    <th className="py-4 px-6 text-center">Featured</th>
                                    <th className="py-4 px-6 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/40 text-xs">
                                {packages.map((pkg) => (
                                    <tr key={pkg._id} className="group hover:bg-slate-800/10 transition-colors">
                                        <td className="py-4 px-6 flex items-center gap-3">
                                            <img src={pkg.image} alt={pkg.name} className="h-10 w-14 rounded-lg object-cover border border-slate-800 shrink-0" />
                                            <div>
                                                <div className="font-bold text-white group-hover:text-brand-primary transition-colors">{pkg.name}</div>
                                                <div className="text-xxs text-slate-500 truncate max-w-md">
                                                    <EnvironmentOutlined /> {pkg.destinations.join(" ➔ ")}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 font-semibold text-slate-300">{pkg.duration}</td>
                                        <td className="py-4 px-6 font-bold text-emerald-400">{pkg.priceRange}</td>
                                        <td className="py-4 px-6 text-center">
                                            <button 
                                                onClick={() => togglePopular(pkg)}
                                                className={`text-base p-1 hover:scale-125 transition-transform ${pkg.isPopular ? "text-amber-400" : "text-slate-600 hover:text-slate-400"}`}
                                                title={pkg.isPopular ? "Remove Popular Tag" : "Mark as Popular"}
                                            >
                                                {pkg.isPopular ? <StarFilled /> : <StarOutlined />}
                                            </button>
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <button 
                                                onClick={() => handleDelete(pkg._id)}
                                                className="text-rose-400 hover:text-rose-350 p-2 hover:bg-rose-950/20 rounded-xl transition-all"
                                                title="Delete Package"
                                            >
                                                <DeleteOutlined />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Create Modal overlay */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setShowModal(false)} />
                    <div className="bg-slate-900 border border-slate-850 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto z-10 shadow-2xl relative animate-fade-in-up">
                        <div className="p-6 border-b border-slate-850 flex justify-between items-center bg-slate-950/20">
                            <div>
                                <h3 className="text-lg font-black text-white">Create Travel Package</h3>
                                <p className="text-xxs text-slate-500">Insert custom parameters to publish a dynamic tour package.</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="text-slate-450 hover:text-white transition-colors">&times;</button>
                        </div>
                        <form onSubmit={handleCreatePackage} className="p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xxs font-black text-slate-500 uppercase tracking-wider">Package Title</label>
                                    <input 
                                        type="text" 
                                        required
                                        placeholder="e.g. Cultural Triangle Explorer"
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 outline-none focus:border-brand-primary"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xxs font-black text-slate-500 uppercase tracking-wider">Duration</label>
                                    <input 
                                        type="text" 
                                        required
                                        placeholder="e.g. 5 Days"
                                        value={duration}
                                        onChange={e => setDuration(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 outline-none focus:border-brand-primary"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xxs font-black text-slate-500 uppercase tracking-wider">Price Range</label>
                                    <input 
                                        type="text" 
                                        required
                                        placeholder="e.g. $450 - $600"
                                        value={priceRange}
                                        onChange={e => setPriceRange(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 outline-none focus:border-brand-primary"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xxs font-black text-slate-500 uppercase tracking-wider">Cover Image URL</label>
                                    <input 
                                        type="url" 
                                        placeholder="Paste a direct image link"
                                        value={image}
                                        onChange={e => setImage(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 outline-none focus:border-brand-primary"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xxs font-black text-slate-500 uppercase tracking-wider">Destinations (separated by commas)</label>
                                <input 
                                    type="text" 
                                    placeholder="Sigiriya, Dambulla, Kandy"
                                    value={destinations}
                                    onChange={e => setDestinations(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 outline-none focus:border-brand-primary"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xxs font-black text-slate-500 uppercase tracking-wider">Includes features (separated by commas)</label>
                                <input 
                                    type="text" 
                                    placeholder="Hotel accommodation, Private transport, English guide"
                                    value={includes}
                                    onChange={e => setIncludes(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 outline-none focus:border-brand-primary"
                                />
                            </div>

                            <div className="pt-4 border-t border-slate-850 flex justify-end gap-3 bg-slate-950/10 -mx-6 -mb-6 p-6">
                                <button 
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="bg-brand-primary text-white font-bold px-5 py-2.5 rounded-full hover:scale-105 active:scale-95 transition-all text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-brand-primary/20"
                                >
                                    {isSubmitting ? <LoadingOutlined /> : <CheckOutlined />} Save Package
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
