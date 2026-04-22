                // {/* create batch dialog */}
                // <Dialog open={isCreateBatchOpen} onOpenChange={setIsCreateBatchOpen}>
                    
                //     <DialogTrigger asChild>
                //         <Button className="cursor-pointer w-full sm:w-auto" disabled={gettingProduct || products.length === 0}>
                //             {!gettingProduct && <Plus className="h-4 w-4" />}
                //             {gettingProduct ? <span>Loading Product...</span> : 
                //                 <>
                //                     <span className="hidden sm:inline">Create Batch</span>
                //                     <span className="sm:hidden">New Batch</span>
                //                 </>
                //             }
                //             {gettingProduct || (products.length === 0 && <span className="hidden sm:inline"> (No products)</span>)}
                //         </Button>
                //     </DialogTrigger>
                    
                //     <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                //         <DialogHeader>
                //             <DialogTitle>Create New Batch</DialogTitle>
                //             <DialogDescription>Create a new manufacturing batch</DialogDescription>
                //         </DialogHeader>
                //         <form onSubmit={handleCreateBatch} method="post">
                //             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                //                 <div className="space-y-2">
                //                     <Label htmlFor="product">Product</Label>
                //                     <Select
                                        // value={newBatch.drugName}
                //                         onValueChange={(value) => setNewBatch({ ...newBatch, drugName: value })}>
                //                         <SelectTrigger>
                //                             <SelectValue placeholder="Select product" />
                //                         </SelectTrigger>
                //                         <SelectContent>
                //                             {products.length > 0 ? (
                //                                 products.map((product) => (
                //                                     <SelectItem key={product.id} value={product.name}>
                //                                         {product.name} ({product.category})
                //                                     </SelectItem>
                //                                 ))
                //                             ) : (
                //                                 <SelectItem value="no-products" disabled>
                //                                     No products available - Create products first
                //                                 </SelectItem>
                //                             )}
                //                         </SelectContent>
                //                     </Select>
                //                 </div>
                //                 <div className="space-y-2">
                //                     <Label htmlFor="quantity">Batch Size</Label>
                //                     <Input
                //                         id="quantity"
                //                         type="number"
                //                         placeholder="Enter quantity"
                //                         max={products.find((product) => product.name === newBatch.drugName && product.organizationId === orgId)?.numberOfProductAvailable}
                //                         min={0}
                //                         value={newBatch.batchSize}
                //                         onChange={(e) => setNewBatch({ ...newBatch, batchSize: e.target.value })}
                //                     />
                //         <p
                //         className="text-xs text-muted-foreground"
                //         >
                //                         max batch size:
                //                         {products.find((product) => product.name === newBatch.drugName && product.organizationId === orgId)?.numberOfProductAvailable}
                //                     </p>
                //                 </div>
                //             </div>
                //             <div className="flex justify-end space-x-2 mt-4">
                //                 <Button className="cursor-pointer" variant="outline" onClick={() => setIsCreateBatchOpen(false)}>
                //                     Cancel
                //                 </Button>
                //                 <Button className="cursor-pointer">{isLoading ? "Creating..." : "Create Batch"}</Button>
                //             </div>
                //         </form>
                //     </DialogContent>

                // </Dialog>