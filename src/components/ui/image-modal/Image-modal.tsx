"use client";

import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { X } from "lucide-react";
import styles from "./ImageModal.module.css";

interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string;
  imageAlt: string;
}

export const ImageModal = ({ isOpen, onClose, imageSrc, imageAlt }: ImageModalProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={styles.overlay}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.button 
            className={styles.closeButton}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <X size={32} />
          </motion.button>

          <motion.div
            className={styles.imageContainer}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            onClick={(e) => e.stopPropagation()} // Чтобы не закрывалось при клике на само фото
          >
            <Image
              src={imageSrc}
              alt={imageAlt}
              width={1600}
              height={900}
              className={styles.modalImage}
              priority
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};